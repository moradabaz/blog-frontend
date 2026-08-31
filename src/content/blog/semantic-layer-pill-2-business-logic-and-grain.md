---
title: "Semantic Layer Pill 2: When One-Line Descriptions Aren't Enough"
description: "Hands-on: swap one-line descriptions for deep doc blocks, deliberately break a dbt contract to watch it fail loudly, and reproduce a real grain bug that richer documentation didn't catch."
pubDate: 2026-08-31
author: "Morad Abaz"
category: "Semantic Layer Pills"
tags: ["Semantic Layer", "dbt", "Data Governance", "Analytics Engineering", "SQL"]
---

> **This is Pill 2** of the Semantic Layer Pills series. Continuing from [Pill 1](/blog/semantic-layer-pill-1-column-descriptions), same [pms-semantic-layer](https://github.com/moradabaz/pms-semantic-layer) checkout, same restored database, same `pms_agent` role.

A one-sentence description works when a column's meaning fits in one sentence. Real business logic usually doesn't. dbt has a real mechanism for this: reusable doc blocks, plus two governance pieces that keep them honest. You're going to read all three in your own checkout, then break one of them on purpose.

## Doc blocks, exposures, contracts: find them in your checkout

Open [`agent_stack/dbt/models/marts/_marts.md`](https://github.com/moradabaz/pms-semantic-layer/blob/main/agent_stack/dbt/models/marts/_marts.md) and find `avg_booking_window_days`:

```
{% docs avg_booking_window_days %}
Average number of days between when a guest booked a reservation and
their check-in date (`start_date - booked_at`).

**Do not compute this from `reservation.created_at`.** `created_at` is a
technical row-insert timestamp, not the date the guest actually made the
booking.
{% enddocs %}
```

That's the "why" a one-line description can't hold. The rule for when a column earns one of these: only when it could be misused in a way that isn't obvious from its name.

Open [`_exposures.yml`](https://github.com/moradabaz/pms-semantic-layer/blob/main/agent_stack/dbt/models/marts/_exposures.yml) next:

```yaml
exposures:
  - name: text_to_sql_agent
    depends_on:
      - ref('mart_kpi')
      - ref('mart_aggregates')
```

This is metadata the model never reads. It's how dbt knows a real consumer (the agent you've been running) depends on these marts, so a future `dbt build` can flag a breaking change against it by name, instead of the agent just starting to throw raw Postgres errors weeks later.

## Try it yourself: break a contract on purpose

Open [`agent_stack/dbt/models/marts/mart_aggregates.sql`](https://github.com/moradabaz/pms-semantic-layer/blob/main/agent_stack/dbt/models/marts/mart_aggregates.sql) and find this line near the end:

```sql
coalesce(sum(orv.occupied_nights_in_month), 0) as occupied_nights,
```

Change it to cast the result to text:

```sql
coalesce(sum(orv.occupied_nights_in_month), 0)::text as occupied_nights,
```

Now run:

```bash
docker compose run --rm dbt build
```

You should see `dbt` refuse to build the model, before creating a single table:

```
Compilation Error in model mart_aggregates
This model has an enforced contract that failed.

| column_name     | definition_type | contract_type | mismatch_reason    |
| ---------------- | --------------- | -------------- | ------------------ |
| occupied_nights  | TEXT             | LONGINTEGER   | data type mismatch |
```

That's [`_marts.yml`](https://github.com/moradabaz/pms-semantic-layer/blob/main/agent_stack/dbt/models/marts/_marts.yml)'s `contract: {enforced: true}` on `mart_aggregates`, comparing the declared `data_type` for every column against what the compiled query actually produces. **Revert the change** before moving on (`git checkout -- agent_stack/dbt/models/marts/mart_aggregates.sql`), then rebuild to confirm you're back to a clean state:

```bash
docker compose run --rm dbt build
```

Without a contract, that type change would have shipped silently, the model would build, the column would now be text, and the first sign of trouble would be a comparison failing somewhere downstream, in a dashboard, a test, or a prompt an LLM never gets to fail on cleanly.

## Run the actual experiment

Same mechanism as Pill 1, one flag flipped:

```bash
docker compose run --rm \
  -e CONTEXT_MODE=docs_full \
  -e TRANSCRIPT_PATH=/content/pill-2-transcript.md \
  live-agent python main_experiment.py
```

`CONTEXT_MODE=docs_full` flips `_resolve_description`'s `short` flag to `False`, every column's full, doc-block-resolved text goes into the prompt instead of just its first sentence.

## What you should see

Open `local_output/pill-2-transcript.md`. In the run behind this pill, five of six questions landed exactly right. The sixth, "which month had the most cancelled reservations, and what's the lost revenue for that month," came back with a number roughly $700 off and a cancellation count an order of magnitude too low, because the query ranked a single accommodation's worst month instead of summing cancellations across the whole portfolio first. Check your own transcript's SQL for that question against `mart_aggregates`' actual grain, **(accommodation, month)**, one row per accommodation per month, and see whether it grouped across accommodations before ranking.

> **Key lesson:** documentation that explains *what a column means* is not the same as documentation that explains *what grain a table is at*. Grain is the single most common thing missing from otherwise-thorough documentation, precisely because it feels too obvious to write down until someone gets it wrong.

## What this teaches you

- **Doc blocks solve reuse, not coverage.** Richer prose protects against the mistakes someone already thought to write down. It does nothing for the ones nobody has hit yet.
- **A contract runs *before* the table exists**, unlike a dbt test, which only checks data that already got built. That's the difference between catching a type change and catching it too late.
- **An exposure is how a dbt project tracks a dependency it otherwise couldn't see** at all, code outside the dbt DAG entirely.

Go deeper in [01-dbt-semantic-layer-governance.md](https://github.com/moradabaz/semantic-layer-pills/blob/main/interview-prep/01-dbt-semantic-layer-governance.md): why tests and contracts check different things (content vs. structure), why `mart_aggregates` got the contract before `mart_kpi` did, and a real accidental test failure (not staged) found while working on source freshness, that turned out to be the exact same "backfill vs. ongoing invariant" bug as one of the nine errors in [Pill 5](/blog/semantic-layer-pill-5-nine-real-errors).

---

> **Next up: [Pill 3: Routing — Giving the Model Only What the Question Needs](/blog/semantic-layer-pill-3-routing)**
>
> **Series: Semantic Layer Pills.** Source project: [pms-semantic-layer](https://github.com/moradabaz/pms-semantic-layer) · Full write-ups: [semantic-layer-pills](https://github.com/moradabaz/semantic-layer-pills).
