---
title: "Spark Pill 0: If PySpark Looks Like Pandas... Why Can't We Just Use Pandas?"
description: "Have you ever wondered why you can't just load 80GB into Pandas? And if Spark only has 48GB of RAM total, why doesn't it crash too? First pill in a series for data engineers who want to understand the internals."
pubDate: 2026-08-30
author: "Morad Abaz"
category: "Spark Pills"
tags: ["Spark", "Pandas", "Distributed Computing", "MapReduce", "Hadoop", "Data Engineering"]
---

> **This is Pill 0** of a series for junior data engineers and data scientists who can run PySpark jobs but don't understand what happens underneath. Each pill starts from a real question.

***Have you ever wondered why you can't just load an 80GB file with `pd.read_csv()` and call it a day? You do it with a 200MB CSV, run `groupby('country').sum()`, and it works in 3 seconds. Same code, bigger file, laptop freezes. Why?***

*Pandas loads the entire CSV into a single Python process, all at once. 80GB into 16GB of RAM won't work.*

*But have you thought about the follow-up question?*

> "My Spark cluster has 3 nodes with 16GB each. That's 48GB total. The data is 80GB. It still doesn't fit. So how does Spark handle it?"

Good question. Let's work through it.

## If Spark also has limited RAM, why doesn't it crash too?

You've probably heard "Spark is fast because it's in-memory." That makes it sound like Spark loads all your data into RAM, like Pandas but spread across machines. Let me show you what actually happens.

Spark processes data in **partitions**, chunks of roughly 128MB each. An 80GB file becomes around 625 partitions. Each executor takes a few partitions, processes them, and moves on to the next batch. At any given moment, each executor only holds a few partitions in memory, not the whole dataset.

When memory runs short, Spark **spills to disk**: it writes intermediate data to the local SSD and keeps going. Slower, but it doesn't crash. Pandas can't do this. It either fits in memory or it fails.

So the difference between Pandas and Spark here is:

- **Pandas:** one machine, one process, everything must fit in RAM at once
- **Spark:** many machines, many processes, data flows through in partitions, can spill to disk when needed

## "But can't I just read Pandas in chunks?"

You can do this:

```python
totals = {}
for chunk in pd.read_csv("big_file.csv", chunksize=50000):
    partial = chunk.groupby("country")["revenue"].sum()
    for country, value in partial.items():
        totals[country] = totals.get(country, 0) + value
```

And it works. For a `sum()`. But look at what you had to do:

1. **You wrote the coordination logic yourself.** You decided how to accumulate partial results. You built the dictionary. You wrote the loop.
2. **It runs sequentially.** Chunk 1, then chunk 2, then chunk 3. One at a time. On one CPU core.
3. **It falls apart for complex operations.** Try doing a `median()` per country with chunks. Or a `join` between two 80GB files. Or a `distinct()`. The manual accumulation logic becomes extremely complicated or outright impossible.

With Spark you write:

```python
df.groupBy("country").sum("revenue")
```

Spark splits the data, runs partial sums in parallel across executors, shuffles the partial results so all rows for "ES" end up in the same place, and combines them. You describe what you want. Spark handles the coordination.

The important difference is not just "parallel vs sequential." It is **who coordinates the distributed work**: you with a for loop, or a framework that knows how to break down, distribute, and recombine any operation.

## What did people do before Spark?

To understand why Spark was built, it helps to know what came before it.

### Before 2004: vertical scaling

If you had more data than one machine could handle, you had two options:

- **Buy a bigger machine.** More RAM, more CPUs. This is vertical scaling. Companies like Teradata and Netezza sold specialized hardware that could process terabytes, for millions of dollars.
- **Write batch scripts.** Perl or Python scripts reading flat files line by line on a single machine. Slow and fragile.

Neither scales well. Doubling your data means buying a machine that costs more than double, and past a certain point, that machine simply doesn't exist.

### 2003 to 2004: Google publishes two papers

Google needed to index the entire web. Billions of pages. No single machine could do it.

They published two papers:

- **Google File System (2003):** split large files into 64MB blocks and store them across thousands of cheap machines.
- **MapReduce (2004):** a programming model to process those distributed files. Every computation breaks into two phases:
  - **Map:** each machine transforms its local chunk independently. No communication between machines.
  - **Reduce:** the partial results are combined across machines into a final answer.

Between Map and Reduce there is a phase called **Shuffle**, where data moves across the network so that all values for the same key end up on the same machine. This is the expensive part.

Yahoo took these ideas and built **Hadoop**, the open-source implementation that made distributed computing accessible beyond Google.

### The problem with Hadoop MapReduce

Hadoop worked, but it had one big limitation: **every Map-Reduce step wrote its output to HDFS (disk) before the next step could read it.**

A pipeline with 5 transformations looked like this:

```
Read -> Map -> Reduce -> Write to disk
Read from disk -> Map -> Reduce -> Write to disk
Read from disk -> Map -> Reduce -> Write to disk
Read from disk -> Map -> Reduce -> Write to disk
Read from disk -> Map -> Reduce -> Write to disk -> Final output
```

Five writes and five reads to disk per pipeline. On the HDDs of that era, this was extremely slow. Jobs that could take 10 minutes ended up taking hours.

### 2009 to 2012: Spark

Matei Zaharia, a PhD student at UC Berkeley, noticed the bottleneck: those intermediate disk writes were unnecessary. If data could stay in memory between steps, you'd skip the slowest part of the pipeline.

His key insight, published in the 2012 RDD paper (*Resilient Distributed Datasets*): you can keep data in memory between operations and still make it fault-tolerant, without writing to disk. How? By remembering the recipe (the sequence of transformations) instead of the result. If a machine dies and its in-memory data is lost, Spark recomputes just that partition by replaying the transformations from the source data.

What Hadoop did in hours, Spark could do in minutes. The reason is straightforward: it removed the unnecessary disk I/O between steps.

## The three actors in a Spark job

Before the next pill, you need to know three things:

### The Driver

A single process that:
- Takes your code (`df.groupBy("country").sum()`)
- Builds a plan (the DAG, a Directed Acyclic Graph)
- Optimizes it (the Catalyst optimizer)
- Splits it into tasks and sends them to the executors
- Collects the final result

The Driver does not process your data. It plans and coordinates. Like a conductor of an orchestra: it decides what each musician plays, but it does not play an instrument itself.

### The Executors

The workers. Multiple JVM processes running on different machines in the cluster. Each executor:
- Receives tasks from the Driver
- Reads its assigned partitions of data
- Applies transformations (filter, map, aggregate)
- Writes shuffle output when needed
- Sends results back to the Driver when you call an action like `collect()` or `count()`

### Partitions

The data chunks. Your 80GB file gets split into around 625 partitions of 128MB each. Partitions are the unit of parallelism: each task processes one partition. More partitions means more tasks and more parallelism, up to the number of available CPU cores.

Here is the mental model:

```
┌─────────────────────────────────────────────────────┐
│                    DRIVER                            │
│  Your code -> DAG -> Catalyst -> Physical Plan       │
└──────────┬──────────────┬──────────────┬────────────┘
           │              │              │
     ┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼─────┐
     │ Executor 1 │ │ Executor 2 │ │ Executor 3 │
     │ Task: P1   │ │ Task: P3   │ │ Task: P5   │
     │ Task: P2   │ │ Task: P4   │ │ Task: P6   │
     └───────────┘ └───────────┘ └───────────┘
```

Each executor picks up partitions and processes them. When it finishes one, it grabs the next. The Driver tracks progress and handles failures.

## Seeing the difference

The same operation in Pandas and Spark:

**Pandas:**
```python
import pandas as pd

df = pd.read_csv("sales.csv")
result = df.groupby("country")["revenue"].sum()
print(result)
```

Python reads the entire file into one DataFrame in memory. The `groupby` runs on one core, in one process. If the file doesn't fit in RAM, it crashes.

**PySpark:**
```python
from pyspark.sql import SparkSession
from pyspark.sql.functions import sum

spark = SparkSession.builder.getOrCreate()
df = spark.read.csv("sales.csv", header=True, inferSchema=True)
result = df.groupBy("country").agg(sum("revenue"))
result.show()
```

Nothing happens until you call `.show()`. The first three lines only build a **plan**. Spark hasn't read a single byte yet. When `.show()` triggers execution:

1. Spark reads the file in parallel (each executor grabs a subset of partitions)
2. Each executor sums its local rows by country (Map phase)
3. Partial sums move across the network so all "ES" rows end up on one executor (Shuffle)
4. Each executor combines its assigned partial sums (Reduce phase)
5. The result is sent to the Driver, which prints it

You can see this plan by calling:

```python
result.explain()
```

This shows you the physical plan with stages, exchanges (shuffles), and projections. We will look at these plans in detail in Pill 2.

## Have you wondered what Spark and Hadoop have in common?

Spark did not invent a new computation model. It inherited Map-Shuffle-Reduce from Hadoop. What Spark improved was the execution, keeping intermediate data in memory instead of writing it to disk between every step.

Every `groupBy`, every `join`, every `distinct` in Spark follows the same pattern Google described in 2004:

1. **Map:** transform data locally within each partition (no network needed)
2. **Shuffle:** move data across the network so all values for the same key land on the same executor
3. **Reduce:** combine the shuffled data into the final result

Spark can chain multiple Map-Shuffle-Reduce steps without writing intermediate results to HDFS between each one. That is the improvement over Hadoop.

In the next pill we will open the MapReduce box and look at what happens in each phase: who are the mappers, who are the reducers, and why the Shuffle is the most expensive operation in distributed computing.

---

> **Next: [Pill 1 Quiz: MapReduce Fundamentals](/pills/quiz-mapreduce)**
>
> **Series: Spark Pills.** Reinforcement notes for data engineers who can run jobs but want to understand the internals. Born from real production questions.
