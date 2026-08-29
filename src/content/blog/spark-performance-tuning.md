---
title: "Spark Performance Tuning: Diagnosing Slow Jobs in Production"
description: "Real-world guide to diagnosing and fixing slow Spark jobs on AWS Glue: understanding partitioning, skew, shuffle, and Iceberg compaction strategies."
pubDate: 2026-08-01
author: "Morad Abaz"
category: "Data Engineering"
tags: ["Spark", "AWS", "Performance", "Data Engineering", "Iceberg"]
---

Running Spark at scale on AWS Glue teaches you things no documentation will tell you. When a job that ran in 20 minutes suddenly takes 3 hours at 8am, you need a systematic approach to narrow down the cause fast.

## The First Questions to Ask

Before touching any config, open the Spark UI and look at:

1. **Stage execution times** — which stage is the bottleneck?
2. **Task distribution** — are some tasks taking 10x longer than others? That's data skew.
3. **Shuffle read/write sizes** — massive shuffles usually mean a `groupBy` or `join` without a good partition key.

## Common Causes & Fixes

### 1. Data Skew in Joins

The most common culprit. One partition gets 80% of the data while the others finish in seconds.

```python
# Instead of:
df.join(lookup, "customer_id")

# Use salting for skewed keys:
from pyspark.sql.functions import rand, floor

df_salted = df.withColumn("salt", floor(rand() * 10))
lookup_exploded = lookup.withColumn("salt", explode(array([lit(i) for i in range(10)])))

df_salted.join(lookup_exploded, ["customer_id", "salt"])
```

### 2. Too Many Small Files (Iceberg)

If you write to an Iceberg table frequently (streaming micro-batches or hourly Glue jobs), you end up with thousands of small files. This tanks read performance.

Fix: Run compaction regularly.

```python
spark.sql("""
  CALL glue_catalog.system.rewrite_data_files(
    table => 'my_database.my_table',
    strategy => 'sort',
    sort_order => 'zorder(event_date, customer_id)',
    options => map('target-file-size-bytes', '134217728')  -- 128 MB
  )
""")
```

### 3. Shuffle Partitions

Spark defaults to 200 shuffle partitions. For large datasets this is too few; for small ones it creates overhead.

```python
# Rule of thumb: target ~128MB per partition after shuffle
spark.conf.set("spark.sql.shuffle.partitions", "800")

# Or let Spark decide (AQE):
spark.conf.set("spark.sql.adaptive.enabled", "true")
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")
```

## AWS Glue-Specific Tips

- Enable **G.2X workers** for memory-intensive joins, not just CPU-heavy transformations.
- Use **Job Bookmarks** carefully — they don't always play well with Iceberg's snapshot isolation.
- Monitor `glue.ALL` metrics in CloudWatch, specifically `glue.driver.jvm.heap.used`.

---

Diagnosing Spark is 80% reading the Spark UI correctly and 20% knowing which knobs to turn. The UI tells the whole story if you know what to look for.
