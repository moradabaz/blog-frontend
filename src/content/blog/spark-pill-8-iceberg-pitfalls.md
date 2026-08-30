---
title: "Spark Pill 8: Iceberg Is Not Free: What Nobody Tells You About the Migration"
description: "Have you ever wondered why your Iceberg table gets slower over time even though the data hasn't grown? Or why a simple DELETE takes longer than rewriting the entire table? Let's look at the pitfalls that only show up in production."
pubDate: 2026-08-30
author: "Morad Abaz"
category: "Spark Pills"
tags: ["Spark", "Apache Iceberg", "Parquet", "Data Lake", "Migration", "Performance"]
---

> **This is Pill 8** of a series for junior data engineers who can run PySpark jobs but don't understand what happens underneath. Each pill starts from a real question.

Have you ever wondered why teams migrate to Apache Iceberg and then, three months later, start seeing jobs fail with OutOfMemory errors on the Driver? The data volume has not changed. The cluster is the same. But suddenly the Driver cannot handle what it handled before.

The answer is metadata. And it is just one of several surprises that only show up after you have been running Iceberg in production for a while.

## Silent metadata accumulation

Every time you write to an Iceberg table, Iceberg creates a new **snapshot**. A snapshot is a pointer to a set of manifest files, which in turn point to the actual data files. This is how Iceberg provides time travel and ACID guarantees.

Here is the part that surprises people: **Iceberg does NOT automatically delete old snapshots.** Every `INSERT`, `MERGE`, `DELETE`, and `OVERWRITE` adds a new snapshot, and the old ones stay.

After three months of daily operations (say, 4 writes per day), you have around 360 snapshots, each referencing its own manifest list and manifest files. The metadata directory grows to hundreds of megabytes.

When Spark opens the table, the **Driver** loads all this metadata into its heap. The Driver is typically configured with 4 to 8 GB of RAM. Once the metadata exceeds what fits in that heap, you get an OutOfMemory error before Spark processes a single row of actual data.

Adding more executors will not help. The Driver is a single process. This is a metadata problem, not a data problem.

**The fix: scheduled maintenance.**

```sql
-- Delete snapshots older than 7 days
CALL catalog.system.expire_snapshots('db.my_table', TIMESTAMP '2026-08-23 00:00:00');

-- Compact manifest files (reduces the number of small manifests)
CALL catalog.system.rewrite_manifests('db.my_table');
```

Run `expire_snapshots` and `rewrite_manifests` on a schedule (daily or weekly). Think of it like vacuuming a PostgreSQL database. Iceberg gives you powerful features, but you must maintain the metadata layer yourself.

## ClusteredWriter vs FanoutWriter: a production trap

When Iceberg writes data into partitioned tables, it uses one of two strategies:

**FanoutWriter** (`fanout-enabled = true`): Keeps N file writers open simultaneously, one per partition. Rows can arrive in any order. If your table has 365 daily partitions and a write touches all of them, FanoutWriter opens 365 writers at once. This costs RAM: each writer holds a buffer.

**ClusteredWriter** (`fanout-enabled = false`, the default): Keeps only one writer active at a time. It writes all rows for partition A, closes that writer, opens a new writer for partition B, and so on. Much lower memory cost. But there is a strict requirement: **the data must arrive sorted by partition column.**

If ClusteredWriter receives a row for partition "2026-01" after it has already closed partition "2026-01" and moved on to "2026-03", it throws an `IllegalStateException`.

Here is a real production scenario. A team had two pipelines:

- **Gold layer:** Used `fanout-enabled = false`. Worked fine because the upstream query had an `ORDER BY partition_date`, so rows arrived sorted.
- **Silver layer:** Copied the same config from Gold. This pipeline read from PostgreSQL via JDBC. PostgreSQL returned rows ordered by the UUID primary key, not by the partition column.

Result: `IllegalStateException` on the Silver pipeline. The data was not sorted by partition.

The fix depends on what you can afford:

```python
# Option 1: Use FanoutWriter (costs more RAM)
spark.conf.set("spark.sql.iceberg.fanout-enabled", "true")

# Option 2: Sort the data before writing (costs a shuffle)
df.repartition("partition_date") \
  .sortWithinPartitions("partition_date") \
  .writeTo("catalog.db.silver_table") \
  .append()
```

Note that `repartition("col")` alone is **not** enough. It groups rows by the column but does not sort them within each partition. You need `.sortWithinPartitions("col")` after the repartition to guarantee order within each task.

## DELETE by non-partition column: slower than a full rewrite

Iceberg tables are typically partitioned by a time column (day, month). This works well for queries that filter by time: Iceberg reads the manifest, identifies which data files contain the requested time range, and skips everything else.

Now consider a GDPR deletion request: "Delete all data for these 165 accounts."

```sql
DELETE FROM catalog.db.events
WHERE account_id IN (101, 102, ..., 265)
```

The table is partitioned by `event_month`. The column `account_id` is not the partition key. Iceberg cannot use partition pruning because any account could appear in any month's partition.

What happens: Iceberg must scan **every data file in every partition** to find rows matching those account IDs. It reads each file, filters out the matching rows, and writes a new version of the file without them.

Real numbers from production: deleting 165 accounts (3% of 5,700 total) from a table with 24 monthly partitions took **22 minutes**. Rewriting the entire table from the source (a full `INSERT OVERWRITE` with a `WHERE account_id NOT IN (...)` filter) took **17 minutes**.

The incremental delete was 30% slower than starting from scratch.

This happens because the "incremental" delete was not actually incremental. It read every file anyway. And on top of the read, it had the overhead of Iceberg's copy-on-write mechanics: reading the old file, filtering, writing the new file, creating new metadata.

**The rule:** If your deletes target a non-partition column and touch a significant fraction of files, compare the delete time against a full rewrite. Sometimes `INSERT OVERWRITE` with a filter is faster and simpler.

## When to use Iceberg vs plain Parquet

Not every table benefits from Iceberg. Here is a decision framework:

| Scenario | Iceberg | Plain Parquet |
|----------|---------|---------------|
| Large table (>1M rows) with incremental updates by partition key | Yes | No |
| Need ACID guarantees (concurrent readers/writers) | Yes | No |
| Need time travel or rollback | Yes | No |
| Schema evolution (adding/renaming columns) | Yes | Possible but manual |
| Small table rewritten entirely each run | Overhead not worth it | Yes |
| Deletes by non-partition column | Slower than expected | Full rewrite is simpler |
| Low-memory workers (small Driver heap) | Metadata can be a problem | No metadata overhead |
| Full recompute already meets your SLA | Extra complexity | Yes |

The question to ask: "Does this table need incremental updates, time travel, or concurrent access?" If the answer is no, plain Parquet with overwrite semantics is simpler, cheaper to maintain, and has no metadata management overhead.

## Post-migration tuning checklist

Once you have migrated to Iceberg, these settings deserve attention:

**1. `spark.sql.shuffle.partitions`:** The default is 200. If your cluster has 32 cores, 200 shuffle partitions means each core processes about 6 partitions. That might be fine. But if your cluster has 8 cores, 200 partitions means 25 passes per core, with scheduling overhead on each. Match this to your actual cluster parallelism, typically 2x to 4x the number of cores.

**2. `coalesce()` after reading many small files:** Iceberg tables that receive frequent small appends accumulate many small data files. When you read such a table, Spark creates one task per file. If you have 3,000 small files, you get 3,000 tasks with minimal data each. Use `coalesce()` to reduce the partition count after reading:

```python
df = spark.read.table("catalog.db.events").coalesce(64)
```

**3. `rewrite_data_files` can silently do nothing:** Iceberg's compaction procedure (`rewrite_data_files`) is supposed to merge small files into larger ones. But it can return success with 0 files rewritten if the files already meet the target size. Always check the return value:

```sql
CALL catalog.system.rewrite_data_files('db.events');
-- Check: if num_rewritten_data_files = 0, compaction did nothing
```

**4. Never TRUNCATE + INSERT without a rollback plan:** If you truncate an Iceberg table and then your INSERT job fails halfway, you have an empty table. With plain Parquet you would just overwrite atomically. With Iceberg, prefer `INSERT OVERWRITE` (which is atomic) over the two-step TRUNCATE + INSERT pattern.

**5. Snapshot retention vs storage cost:** Keeping 30 days of snapshots means 30 days of time travel, but it also means Iceberg retains all data files referenced by those snapshots. A file deleted by a `DELETE` command is not physically removed until the snapshot referencing it expires. Factor this into your storage cost estimates.

Iceberg is a powerful tool. It solves real problems around ACID compliance, schema evolution, and time travel. But it is not a drop-in replacement for Parquet. The metadata layer, the writer semantics, and the delete behavior all require understanding and tuning. Treat the migration as adopting a new database engine, not just changing a file format.

---

> **Test yourself: [Pill 8 Quiz: Iceberg Pitfalls](/pills/quiz-pill-8)**
>
> **Next: [Pill 9: Why Lambda Doesn't Work for Streaming](/blog/spark-pill-9-streaming-and-state)**
>
> **Series: Spark Pills.** Reinforcement notes for data engineers who can run jobs but want to understand the internals. Born from real production questions.
