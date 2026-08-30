---
title: "Spark Pill 4: The Computer Science behind Broadcast or Sort-Merge Joins"
description: "Have you ever wondered why one join finishes in 30 seconds and another identical-looking join takes 90 minutes? The answer lies in which join strategy Spark picks, and whether you can eliminate the shuffle entirely."
pubDate: 2026-08-30
author: "Morad Abaz"
category: "Spark Pills"
tags: ["Spark", "Joins", "Broadcast Join", "Sort-Merge Join", "Bucketing", "Performance"]
---

> **This is Pill 4** of a series for junior data engineers and data scientists who can run PySpark jobs but don't understand what happens underneath. Each pill starts from a real question.

Have you ever wondered why two joins with the exact same logic can have completely different runtimes? Same keys, same tables, same cluster. One finishes in 30 seconds, the other times out after 90 minutes. The difference comes down to which join strategy Spark chooses, and understanding these strategies is one of the most practical things you can learn about Spark performance.

## The two main join strategies

When Spark needs to join two DataFrames, it picks one of two main strategies: **Broadcast Hash Join** or **Sort-Merge Join**. Each has a fundamentally different approach to getting matching keys onto the same executor.

### Broadcast Hash Join: the small table shortcut

If one of your tables is small enough to fit in each executor's memory, Spark can skip the shuffle entirely. Here is what happens:

1. The Driver collects the small table (call it M, with `m` rows)
2. It broadcasts a copy of M to every executor
3. Each executor builds a **HashMap** from M in its local memory
4. For each row of the big table N, the executor does an O(1) lookup in the HashMap

```
┌──────────────────────────────────────────────────────┐
│                     DRIVER                            │
│       Collects small table M (e.g. 5,000 rows)       │
│       Broadcasts M to all executors                   │
└────────┬────────────────┬────────────────┬───────────┘
         │  full copy of M │  full copy of M │
    ┌────▼────┐      ┌────▼────┐      ┌────▼────┐
    │Executor1│      │Executor2│      │Executor3│
    │HashMap M│      │HashMap M│      │HashMap M│
    │Scan N   │      │Scan N   │      │Scan N   │
    │partitions      │partitions      │partitions
    │1,2,3    │      │4,5,6    │      │7,8,9    │
    └─────────┘      └─────────┘      └─────────┘
```

**Total cost: O(N + M).** No shuffle, no sort, no network transfer for the big table. Each executor reads its local partitions of N and looks up keys instantly.

Spark uses this strategy automatically when one side of the join is below `spark.sql.autoBroadcastJoinThreshold` (default: 10 MB). You can also force it with `F.broadcast()`:

```python
from pyspark.sql import functions as F

result = big_df.join(
    F.broadcast(small_df),
    on="country_code",
    how="inner"
)
```

### Sort-Merge Join: the general purpose strategy

When both tables are large, broadcasting is not an option. Spark falls back to Sort-Merge Join, which uses the shuffle mechanism from Pill 3:

1. **Shuffle both tables** by the join key: `Hash(key) % num_partitions` determines which partition (and which executor) each row goes to
2. **Sort** each partition locally by the join key
3. **Merge** the two sorted streams: walk through both sides simultaneously, matching keys as you go

```
Table A                              Table B
┌─────────┐                         ┌─────────┐
│ Shuffle  │                         │ Shuffle  │
│ by key   │                         │ by key   │
└────┬─────┘                         └────┬─────┘
     │                                    │
     ▼                                    ▼
┌─────────────────────────────────────────────┐
│              Executor 1                      │
│  A partitions (key hash = 0) sorted          │
│  B partitions (key hash = 0) sorted          │
│  Merge: walk both sides, emit matches        │
├─────────────────────────────────────────────┤
│              Executor 2                      │
│  A partitions (key hash = 1) sorted          │
│  B partitions (key hash = 1) sorted          │
│  Merge: walk both sides, emit matches        │
└─────────────────────────────────────────────┘
```

**Total cost: O(N log N + M log M)** for the sort, plus the full shuffle of both tables across the network.

Sort-Merge Join is more expensive, but it is robust. Because it processes data in sorted order, it can spill to disk without running out of memory. It handles tables of any size.

## The danger: forcing Broadcast on a table that does not fit

Here is a mistake that looks harmless:

```python
# "medium_df has 2 million rows, but it's only a few columns, right?"
result = big_df.join(
    F.broadcast(medium_df),
    on="user_id"
)
```

If `medium_df` exceeds the executor's available heap when serialized and loaded as a HashMap, you get an immediate **OutOfMemoryError**. The executor tries to hold the entire broadcasted table in memory. Unlike Sort-Merge Join, there is no fallback to disk. It either fits or it fails.

The `autoBroadcastJoinThreshold` of 10 MB is conservative for a reason. Increasing it carelessly (or using explicit `F.broadcast()` on a table you have not measured) is one of the most common causes of OOM in Spark joins.

## A real anti-pattern: when removing Broadcast causes a timeout

This happened in production. A pipeline joined a large table (315K rows) with a small lookup table (5K rows). The original code used an explicit `F.broadcast()` hint. During a refactoring pass, someone removed the hint, reasoning that "Spark should pick the right strategy automatically."

The 5K-row table was well under 10 MB, so you would expect AQE (Adaptive Query Execution) to detect it and broadcast automatically. But this join happened after several prior shuffle stages, and the statistics Spark collected were not accurate enough for AQE to make the right call. Spark chose Sort-Merge Join: two full shuffles, sorting on both sides.

The result: the job went from **17 minutes to a 90-minute timeout**. Restoring the explicit `F.broadcast()` hint fixed it immediately.

The lesson: AQE is powerful, but it relies on runtime statistics that degrade after complex multi-stage plans. When you know a table is small, an explicit hint is cheap insurance.

## Bucketing: paying the shuffle cost once at write time

If two large tables are always joined on the same key (for example, `orders` and `order_items` joined on `order_id`), you can eliminate the shuffle and sort at query time by **bucketing** them at write time.

Bucketing means pre-partitioning the data into a fixed number of buckets using `Hash(key) % num_buckets`, and sorting each bucket by the key, when you write the table:

```python
# Write bucketed tables (one-time cost)
orders_df.write \
    .bucketBy(256, "order_id") \
    .sortBy("order_id") \
    .saveAsTable("gold.orders_bucketed")

order_items_df.write \
    .bucketBy(256, "order_id") \
    .sortBy("order_id") \
    .saveAsTable("gold.order_items_bucketed")
```

Now when you join them:

```python
result = spark.table("gold.orders_bucketed").join(
    spark.table("gold.order_items_bucketed"),
    on="order_id"
)
```

Spark recognizes that both tables are already bucketed and sorted by the same key with the same number of buckets. It skips the shuffle and the sort entirely. Bucket 0 from the left table matches bucket 0 from the right table, already sorted. The join becomes a simple local merge on each executor.

**The cost of the shuffle and sort is paid once at write time, not on every read.**

### When NOT to use bucketing

Bucketing is not free, and it is not always the right choice:

- **Tables that change join keys.** If you bucket by `order_id` but next month you need to join by `customer_id`, the bucketing is useless for that query.
- **Small tables where broadcast is enough.** Bucketing a 5,000-row lookup table adds write complexity for no benefit.
- **Tables with very high cardinality keys** where the bucket count is hard to choose well.
- **Frequently overwritten tables** where the write overhead is paid too often relative to the read benefit.

Bucketing works best for stable Gold-layer tables that are joined repeatedly on the same key by many downstream queries.

## The connection to Data Skew

In Sort-Merge Join, both tables are redistributed using `Hash(key) % num_partitions`. This means every row with the same key ends up on the same executor. That works well when keys are distributed evenly.

But what if one key has 70% of the data? All that data goes to one partition, on one executor. The other 39 executors sit idle while one executor struggles with 70% of the workload.

This is **Data Skew**, and it is the subject of Pill 5. Sort-Merge Join is where skew hits hardest, because the shuffle concentrates matching keys by design.

---

> **Next: [Pill 4 Quiz: Join Strategies and Bucketing](/pills/quiz-pill-4)**
>
> **Next pill: [Pill 5: I Have 10 Cores but My Job Runs Like It Has 1](/blog/spark-pill-5-data-skew)**
>
> **Series: Spark Pills.** Reinforcement notes for data engineers who can run jobs but want to understand the internals. Born from real production questions.
