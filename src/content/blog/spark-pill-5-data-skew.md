---
title: "Spark Pill 5: I Have 10 Cores but My Job Runs Like It Has 1. What's Going On?"
description: "Have you ever wondered why your Spark job uses 10 executors but one task takes 50x longer than the rest? The culprit is Data Skew, and it can turn a 5-minute job into a 2-hour timeout."
pubDate: 2026-08-30
author: "Morad Abaz"
category: "Spark Pills"
tags: ["Spark", "Data Skew", "Performance", "Salting", "AQE", "Spark UI"]
---

> **This is Pill 5** of a series for junior data engineers and data scientists who can run PySpark jobs but don't understand what happens underneath. Each pill starts from a real question.

Have you ever looked at the Spark UI and seen 39 tasks finish in 2 seconds while the last task takes 12 minutes? You have 10 executors, 40 cores, and enough memory. But the job crawls. Adding more executors does not help. Adding more memory does not help. What is going on?

## How skew happens: the math

In Pill 4 we saw that Sort-Merge Join redistributes data using `Hash(key) % num_partitions`. Every row with the same key lands on the same partition, on the same executor.

Let me show you what happens with a real scenario. Suppose you are joining a transactions table by `country_code`, with 40 partitions:

```
Hash('ES') % 40 = 6
Hash('FR') % 40 = 12
Hash('DE') % 40 = 27
Hash('IT') % 40 = 33
... and so on
```

If Spain represents 70% of your transactions, then 70% of all data goes to partition 6, assigned to a single executor. The other 39 partitions share the remaining 30%.

```
Partition  6 (ES): ████████████████████████████████████ 70%
Partition 12 (FR): ████ 8%
Partition 27 (DE): ███ 6%
Partition 33 (IT): ███ 5%
Partitions 0-39:   ██ remaining 11% spread across 36 partitions
```

One core does 70% of the work. The other 39 cores finish quickly and sit idle, waiting.

## The death cascade: four steps from skew to failure

Skew does not just slow things down. Under heavy load, it triggers a cascade of failures. Here is the sequence:

### Step 1: Single-thread bottleneck

One partition equals one task, and one task runs on one CPU thread. When 70% of the data lands in one partition, that single thread must process all of it while the rest of the cluster is idle. Your job runs at the speed of one core, regardless of how many you have.

### Step 2: Spill to disk

The skewed partition is far larger than what the executor's memory fraction can hold. Spark starts spilling intermediate data to the local disk. Disk I/O is orders of magnitude slower than memory. The more data spills, the worse it gets. This is not a linear slowdown: repeated spill-and-read cycles compound.

### Step 3: GC storm

As the executor's JVM heap fills with the oversized partition's data, the garbage collector activates aggressively. In the worst case, the JVM enters **Stop-The-World** pauses, freezing all threads on that executor. Processing halts. The executor becomes unresponsive.

### Step 4: Timeout and death

The frozen executor stops sending heartbeats to the Driver. After the timeout threshold (default: 120 seconds), the Driver declares the executor dead and cancels the stage. If retries are configured, Spark reassigns the task, but the same skewed partition goes to another executor, which hits the same cascade.

```
Skewed partition too large
     │
     ▼
Memory fills → Spill to disk (slow)
     │
     ▼
JVM heap pressure → GC storms (Stop-The-World)
     │
     ▼
Executor unresponsive → Heartbeat timeout
     │
     ▼
Driver kills executor → Stage fails
```

## How to detect skew in the Spark UI

Open the Spark UI, navigate to the Stages tab, and look at the task metrics for a slow stage. The key comparison:

| Metric | What to check |
|--------|---------------|
| Duration (P75) | The 75th percentile task duration |
| Duration (Max) | The longest single task |
| Spill (Memory) | How much data was spilled from memory |
| Spill (Disk) | How much spilled data was written to disk |

**The diagnostic rule:** if `Max` is more than 10x `P75`, you have skew. If it is 100x, you have severe skew.

For example:

```
P75 duration:  3 seconds
Max duration:  310 seconds
Spill (Disk):  12 GB (on the max task)
```

This tells you that most tasks finish in a few seconds, but one task is processing so much data that it spills 12 GB to disk and takes over 5 minutes. That is textbook skew.

## Mitigation strategies

### Salting: distribute the hot key manually

The idea behind salting is simple. If `Hash('ES')` always sends Spain to the same partition, add random noise to the key so that Spain's rows spread across multiple partitions.

```python
from pyspark.sql import functions as F
import random

num_salts = 10  # Spread hot key across 10 partitions

# Salt the skewed (big) table
big_salted = big_df.withColumn(
    "salt", (F.rand() * num_salts).cast("int")
).withColumn(
    "salted_key", F.concat(F.col("country_code"), F.lit("_"), F.col("salt"))
)

# Explode the small table to match all salts
from pyspark.sql.types import ArrayType, IntegerType
salt_range = list(range(num_salts))

small_exploded = small_df.withColumn(
    "salt", F.explode(F.array([F.lit(i) for i in salt_range]))
).withColumn(
    "salted_key", F.concat(F.col("country_code"), F.lit("_"), F.col("salt"))
)

# Join on the salted key
result = big_salted.join(small_exploded, on="salted_key", how="inner")
```

Instead of all Spain rows going to one partition, they spread across 10 partitions. The tradeoff: the small table is replicated 10x, but the hot key's load is distributed evenly.

### AQE: Adaptive Query Execution (Spark 3+)

AQE can detect skewed partitions at runtime and split them automatically. Enable it with:

```python
spark.conf.set("spark.sql.adaptive.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")
```

AQE monitors partition sizes during shuffles. When it detects a partition that is significantly larger than the median, it splits that partition into smaller sub-partitions and processes them in parallel.

AQE works well for moderate skew. For extreme skew (one key with 70%+ of data) or skew that appears after several stages where statistics are degraded, manual salting is more reliable.

### Separate NULL handling

NULL keys are a hidden source of skew. `Hash(NULL)` sends all NULLs to the same partition. If 30% of your join key is NULL, that is instant skew.

```python
# Handle NULLs separately
non_null_df = df.filter(F.col("join_key").isNotNull())
null_df = df.filter(F.col("join_key").isNull())

# Join only non-null rows
joined = non_null_df.join(other_df, on="join_key")

# Handle nulls with your business logic (often: discard or assign defaults)
result = joined.unionByName(null_df_with_defaults)
```

## Skew is not just in joins

Joins get the most attention because they combine skew from both tables, but any operation that uses `Hash(key) % num_partitions` is vulnerable:

- **`groupBy().agg()`:** All rows for the hot key go to one reducer. A `groupBy("country").agg(sum("revenue"))` with 70% Spain concentrates 70% of work on one executor.
- **`distinct()`:** Deduplication requires all identical values on the same partition.
- **`sort()` / `orderBy()`:** Range partitioning can create skewed partitions if the data distribution is uneven.
- **`repartition(col)`:** Explicitly hashing by a skewed column creates the problem directly.

The join case is the worst because both sides of the join contribute data to the skewed partition. If the left table has 70% Spain and the right table also has significant Spain rows, the executor must hold and cross-match data from both.

## Hidden skew anti-pattern: collect() + isin()

This is a subtle pattern that does not look like a skew problem at first.

```python
# Step 1: Collect a list of IDs from a small query
id_list = (
    spark.table("active_users")
    .select("user_id")
    .distinct()
    .collect()
)
python_ids = [row.user_id for row in id_list]

# Step 2: Filter a large Iceberg table using isin()
result = (
    spark.table("events_iceberg")
    .filter(F.col("user_id").isin(python_ids))
)
```

This works when `python_ids` has 1,000 entries. But the list grows silently over time. When it exceeds the threshold where Iceberg can effectively prune files using min/max statistics (typically a few thousand values), the file pruning stops working. Instead of reading 314 files, the scan reads 1,780 files.

The key signal is not elapsed time. **Profile by task count.** If your filter stage suddenly goes from 314 tasks to 1,780 tasks, the `isin()` list has grown past the pruning threshold. The fix is to replace `collect() + isin()` with a proper semi-join:

```python
# Instead of collect + isin, use a semi-join
active_users = spark.table("active_users").select("user_id").distinct()

result = (
    spark.table("events_iceberg")
    .join(active_users, on="user_id", how="left_semi")
)
```

The semi-join lets Spark use its join strategies (including broadcast if the user list is small enough) and preserves Iceberg's file pruning capabilities.

## Diagnostic summary

When you suspect skew, check these signals:

1. **Spark UI task metrics:** Max duration >> P75 duration
2. **Spill metrics:** High spill (Memory/Disk) on the slowest tasks
3. **Executor utilization:** Most executors idle while one is at 100%
4. **Adding resources does not help:** More cores or memory does not reduce runtime
5. **Task count spikes:** A filter step that used to launch 300 tasks now launches 1,800

---

> **Next: [Pill 5 Quiz: Data Skew](/pills/quiz-pill-5)**
>
> **Next pill: [Pill 6: Cache, Persist, or Checkpoint? The Lineage Trap](/blog/spark-pill-6-cache-persist-checkpoint)**
>
> **Series: Spark Pills.** Reinforcement notes for data engineers who can run jobs but want to understand the internals. Born from real production questions.
