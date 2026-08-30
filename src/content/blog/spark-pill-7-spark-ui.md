---
title: "Spark Pill 7: Learn to Read the Spark UI or You're Flying Blind"
description: "Have you ever wondered what all those numbers in the Spark UI actually mean? Jobs, stages, tasks, shuffle bytes, spill, GC time. Let's decode them so you can diagnose problems in minutes instead of guessing for hours."
pubDate: 2026-08-30
author: "Morad Abaz"
category: "Spark Pills"
tags: ["Spark", "Spark UI", "Debugging", "Performance", "Monitoring"]
---

> **This is Pill 7** of a series for junior data engineers who can run PySpark jobs but don't understand what happens underneath. Each pill starts from a real question.

Have you ever wondered what all those numbers in the Spark UI mean? You open it, you see a wall of metrics, stage timelines, task distributions, and you close it. "The job finished. Good enough."

Until the day a job that used to take 8 minutes now takes 55 minutes, and someone asks you "why." Let me show you how to read the UI so you can answer that question in minutes.

## The Spark UI hierarchy: Jobs, Stages, Tasks

Every Spark application has one UI, usually at port 4040. The structure follows the execution model we covered in earlier pills:

```
Application
  └── Job 1           (triggered by one action: .write(), .count(), .show())
  │     ├── Stage 0   (a block of transformations with no shuffle between them)
  │     │     ├── Task 0  (one partition processed by one core)
  │     │     ├── Task 1
  │     │     └── Task 2
  │     └── Stage 1
  │           ├── Task 0
  │           └── Task 1
  └── Job 2
        └── ...
```

**Job** = one action. Every time you call `.write()`, `.count()`, `.collect()`, or `.show()`, Spark creates a job.

**Stage** = a group of transformations that can run without moving data across the network. Stages are separated by shuffles. If your plan has two shuffles, you get three stages.

**Task** = one partition processed by one CPU core. A stage with 200 partitions generates 200 tasks.

## Reading the visual DAG: every cut is a shuffle

In the Spark UI, click on a job and you will see the DAG visualization. It looks like a flowchart of boxes connected by arrows.

The key insight: **every boundary between stages is a shuffle** (labeled as "Exchange" in the physical plan). When you see the DAG split into Stage 0 and Stage 1, data moved across the network between them.

```
┌──────────────────┐      ┌──────────────────┐
│     Stage 0      │      │     Stage 1      │
│                  │      │                  │
│  Scan Parquet    │      │  HashAggregate   │
│  Filter          │ ───► │  (final combine) │
│  Partial Agg     │      │                  │
│                  │ Exchange (shuffle)       │
└──────────────────┘      └──────────────────┘
```

If you count the exchanges, you know how many times your data crosses the network. Fewer exchanges generally means faster execution.

## The metrics that matter in each stage

When you click on a stage, Spark shows a summary table and a task-level breakdown. Here are the metrics worth checking:

**Duration:** How long the stage took. This is your first signal. If one stage dominates the total job time, that is where you focus.

**Shuffle Read / Shuffle Write:** How many bytes moved across the network. If shuffle write is 50GB but your input data is 2GB, something is wrong. You may be shuffling too many columns (select only the ones you need before the join).

**Spill (Memory):** Data that did not fit in the execution memory and was serialized to be written to disk. Small amounts are normal.

**Spill (Disk):** Data that actually hit the local SSD because memory was full. When this number is large (gigabytes), your tasks are too big for the available memory per core. Either increase memory per executor or increase partition count to make each partition smaller.

**GC Time:** Time the JVM spent collecting garbage instead of doing useful work. If GC time is more than 10% of task duration, the executor is memory-starved. Tasks are creating objects faster than the JVM can reclaim them.

## The P75 vs Max trick: your single most useful diagnostic

In the stage detail view, Spark shows percentile distributions for task duration: Min, P25, Median, P75, Max.

This distribution tells you what kind of problem you have:

**If Max is 100x the P75:** You have data skew. One partition has far more data than the others. One task is doing 100x the work while the other tasks finish quickly and sit idle. Go back to Pill 5 and apply salting or pre-filtering.

**If all tasks take similar time but the stage is slow:** The problem is general volume. Every partition is equally large, and the computation is genuinely heavy. Adding more executors or increasing partition count can help here, because the work distributes evenly.

**If the timeline shows long gaps with no executor activity:** The Driver is the bottleneck. It is spending time planning (Catalyst optimization on a complex query) or collecting results. This is the lineage problem from Pill 6: `checkpoint()` can help.

```
Scenario A: Skew                    Scenario B: Volume
┌─────┐                             ┌──────────────────┐
│T1: 3s│                            │T1: 120s          │
├─────┤                             ├──────────────────┤
│T2: 3s│                            │T2: 118s          │
├─────┤                             ├──────────────────┤
│T3: 3s│                            │T3: 122s          │
├─────┤                             ├──────────────────┤
│T4:                          300s│ │T4: 119s          │
└─────────────────────────────────┘ └──────────────────┘
P75: 3s, Max: 300s → SKEW          P75: 120s, Max: 122s → VOLUME
```

## Practical example 1: Skew in a 4-node cluster

You have a join between a transactions table and a customers table, running on 4 nodes with 4 cores each (16 tasks in parallel). The job takes 45 minutes. You open the Spark UI and check the shuffle stage:

| Task | Shuffle Read | Spill (Disk) | GC Time | Duration |
|------|-------------|--------------|---------|----------|
| T1   | 30 MB       | 0            | 2s      | 18s      |
| T2   | 28 MB       | 0            | 1s      | 16s      |
| ...  | ~30 MB      | 0            | ~2s     | ~17s     |
| T14  | **2.1 GB**  | **5.2 GB**   | **340s**| **42 min** |

Task 14 received 2.1 GB of shuffle data while every other task got around 30 MB. That one task spilled 5.2 GB to disk because the data did not fit in memory. GC time at 340 seconds means the JVM spent almost 8 minutes just doing garbage collection.

The other 15 tasks finished in under 20 seconds and then sat idle for 41 minutes waiting for Task 14. This is textbook skew: one hot key pulling all the data to a single partition.

The fix is not adding more nodes. 15 of 16 cores are already idle. The fix is addressing the skew: salt the join key (Pill 5), or pre-filter the hot key and handle it separately.

## Practical example 2: The lineage trap

A daily pipeline normally completes in 12 minutes. One day it takes 33 minutes. You open the Spark UI and look at the timeline. Here is what you see:

```
Timeline:
0 min ─────────────────────────────── 33 min
[                                    ]
[  No executor activity: 21 min      ][ Stage execution: 12 min ]
```

For 21 minutes, no executor did any work. The Driver was busy. Doing what?

Planning. The Catalyst optimizer was analyzing a query plan with hundreds of nodes (a DataFrame built through dozens of chained transformations, unions, and joins). The Driver, which is a single JVM process, was solving the optimization problem before sending a single task to the cluster.

This is the lineage problem from Pill 6. The fix is to insert `checkpoint()` at strategic points, which tells Spark: "Write this intermediate result to disk, forget everything before it, and start a fresh plan from here." The Driver's optimization problem becomes smaller, and planning drops from 21 minutes to a few seconds.

## Practical example 3: Task count inflation

You read a partitioned Parquet table with `spark.read.parquet("s3://data/events/")`. The table has around 91 Parquet files. But the Spark UI shows the scan stage has **1,780 tasks**.

Each task processes a tiny amount of data, maybe a few hundred rows, but there are nearly 20x more tasks than files. What happened?

Look at the filter in your code:

```python
account_ids = [list of 1,780 IDs]
df = spark.read.parquet("s3://data/events/") \
    .filter(col("account_id").isin(account_ids))
```

The `isin()` with a large list can prevent partition pruning. Instead of reading just the relevant Parquet row groups, Spark opens every file and creates a task per row group per file. You end up with thousands of tiny tasks.

The overhead is in scheduling. Each task has a fixed cost: the Driver must serialize it, send it to an executor, the executor must deserialize it, set up the task, and report back. With 1,780 tasks doing minimal work each, the scheduling overhead dominates the actual processing time.

The fix (from Pill 5): convert the ID list into a small DataFrame and use a broadcast join instead of `isin()`. This lets Spark push down the filter properly and prune partitions at the file level.

## When adding more nodes helps (and when it does not)

This is a question that comes up every time a job is slow: "Should we add more machines?"

**Adding nodes helps when:**
- The P75 vs Max ratio is close to 1 (no skew) and all tasks are slow. The work is evenly distributed but there is too much of it per core. More cores = smaller partitions per core = faster execution.
- Shuffle read/write is high and network bandwidth is the bottleneck. More nodes means more aggregate network bandwidth.

**Adding nodes does NOT help when:**
- One task has 100x more data than the rest (skew). You could have 1,000 nodes, but the skewed partition still lands on one core. Fix the skew first.
- The Driver is spending 20 minutes planning (lineage problem). The Driver is one process on one machine. Adding executor nodes does not speed up planning. Use `checkpoint()`.
- Task scheduling overhead is the bottleneck (thousands of tiny tasks). More executors means the Driver must coordinate with even more processes. `coalesce()` to reduce the number of tasks.

The Spark UI gives you the evidence to distinguish between these cases. Get comfortable reading it, and you will stop guessing.

---

> **Test yourself: [Pill 7 Quiz: Spark UI](/pills/quiz-pill-7)**
>
> **Next: [Pill 8: Iceberg Is Not Free](/blog/spark-pill-8-iceberg-pitfalls)**
>
> **Series: Spark Pills.** Reinforcement notes for data engineers who can run jobs but want to understand the internals. Born from real production questions.
