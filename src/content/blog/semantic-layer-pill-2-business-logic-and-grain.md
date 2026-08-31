---
title: "Semantic Layer Pill 2: When One-Line Descriptions Aren't Enough"
description: "Doc blocks, exposures, and contracts: the dbt mechanisms for real business logic. Richer documentation fixed real gaps, but it also missed a grain mismatch that produced a confident, wrong answer."
pubDate: 2026-08-31
author: "Morad Abaz"
category: "Semantic Layer Pills"
tags: ["Semantic Layer", "dbt", "Data Governance", "Analytics Engineering", "SQL"]
---

> **This is Pill 2** of the Semantic Layer Pills series. [Pill 1](/blog/semantic-layer-pill-1-column-descriptions) got 6/6 correct answers using one-line column descriptions. This pill asks: what happens with real, deep business logic that doesn't fit in one sentence?

**In this pill:**
- [Doc blocks: where the long explanation lives](#doc-blocks-where-the-long-explanation-lives)
- [Exposures: does anyone know something real depends on this](#exposures-does-anyone-know-something-real-depends-on-this)
- [Contracts: stop the schema from silently drifting](#contracts-stop-the-schema-from-silently-drifting)
- [The experiment](#the-experiment)
- [The result: 5/6 correct, 1 confidently wrong](#the-result-56-correct-1-confidently-wrong)
- [What actually went wrong: the grain problem](#what-actually-went-wrong-the-grain-problem)
- [What doc blocks solved, and what they didn't](#what-doc-blocks-solved-and-what-they-didnt)

A one-sentence description works when a column's meaning fits in one sentence. Real business logic usually doesn't. "This counts cancellations, but per accommodation per month, and here's why a naive date comparison would be wrong" is not one sentence, and cramming three of those into a YAML file turns a readable catalog into a wall of text nobody reads, model or human. dbt has a real mechanism for this problem: reusable doc blocks, plus two governance pieces that keep them honest.

## Doc blocks: where the long explanation lives

A column's `description:` can be a plain string, or a reference to a named block defined once in a separate markdown file:

```yaml
# models/marts/_marts.yml
- name: avg_booking_window_days
  description: "{{ doc('avg_booking_window_days') }}"
```

```
# models/marts/_marts.md
{% docs avg_booking_window_days %}
Average number of days between when a guest booked a reservation and
their check-in date (`start_date - booked_at`).

**Do not compute this from `reservation.created_at`.** `created_at` is a
technical row-insert timestamp, not the date the guest actually made the
booking.
{% enddocs %}
```

The YAML file stays a one-liner per column; the actual paragraph lives once, under a name any column can reference. The rule for *when* a column earns one of these: only when it could be misused in a way that isn't obvious from its name. Everything else stays a plain one-liner.

## Exposures: does anyone know something real depends on this

```yaml
exposures:
  - name: text_to_sql_agent
    type: application
    depends_on:
      - ref('mart_kpi')
      - ref('mart_aggregates')
```

This is dbt metadata; the model never reads it. It's how the dbt project itself knows a real, named consumer depends on specific marts, so if someone later renames or drops a column those marts expose, dbt can flag it as a breaking change against *that specific consumer* instead of the change shipping silently. Without this, dropping a column that an agent quietly relies on wouldn't fail `dbt build` at all, the agent would just start throwing raw Postgres errors weeks later, with nobody connecting the dots back to that change.

## Contracts: stop the schema from silently drifting

```yaml
models:
  - name: mart_aggregates
    config:
      contract:
        enforced: true
    columns:
      - name: occupied_nights
        data_type: bigint
```

`enforced: true` plus an explicit type on every column makes `dbt build` refuse to run if a column's real type stops matching what's declared. This was tested for real: deliberately casting `occupied_nights` to `TEXT` while the contract still declared `bigint` made `dbt run` fail immediately, before a single table got created:

```
Compilation Error in model mart_aggregates
This model has an enforced contract that failed.

| column_name    | definition_type | contract_type | mismatch_reason    |
| --------------- | ---------------- | -------------- | ------------------ |
| occupied_nights | TEXT             | LONGINTEGER    | data type mismatch |
```

Without the contract, that change ships silently, and the first sign of trouble is a comparison or arithmetic operation failing somewhere downstream, in a dashboard, a test, or a prompt an LLM never gets to fail on cleanly.

None of these three change what a prompt looks like. Doc blocks are the *content*; exposures and contracts are what make trusting that content reasonable in the first place.

## The experiment

Same setup as Pill 1: same four tables, same six questions, no routing. The only change: every column's *full*, doc-block-resolved text goes into the prompt instead of just its first sentence.

## The result: 5/6 correct, 1 confidently wrong

Five questions landed exactly right. The sixth, "which month had the most cancelled reservations, and what's the lost revenue for that month," came back with **February 2026, 2 cancellations, $62,284.22 lost.**

The real number, checked directly against the database: **January 2026, 45 cancellations, $61,605.58.**

$62,284 for two cancelled reservations is already implausible on its face, this dataset's nightly rates run $40-$350, not $30,000 a booking. A number an order of magnitude off from the rest of your data deserves a second look before it goes in a slide deck.

## What actually went wrong: the grain problem

```sql
SELECT month, cancelled_count
FROM public_marts.mart_aggregates
ORDER BY cancelled_count DESC
LIMIT 1
```

**Grain** is the level of detail one row of a table represents. `mart_aggregates` is grained at **(accommodation, month)**: one row per accommodation, per month. `ORDER BY ... LIMIT 1` on that raw table picks the single best *accommodation-month* (one property's worst month), not the month with the most cancellations across the whole portfolio. It never summed across accommodations first. The query is syntactically valid, it runs, and it returns something that looks exactly like the answer to the question asked, just not that answer.

> **Key lesson:** documentation that explains *what a column means* is not the same as documentation that explains *what grain a table is at*. This project's doc blocks were full of "why" (proration logic, timing caveats), but nobody had ever written "this is per accommodation per month, sum across accommodations before ranking months" for `cancelled_count`. Grain is the single most common thing missing from otherwise-thorough documentation, precisely because it feels too obvious to write down until someone gets it wrong.

## What doc blocks solved, and what they didn't

Doc blocks are a real step up: they let a business rule exist at all without forcing every column's description into a paragraph. What they don't solve is *coverage*. Richness isn't the same as completeness, nobody had written a grain warning because it hadn't caused a real problem yet.

Two ways to close a gap like this, in order of preference:

1. **Fix it in the mart, not the docs.** A dedicated table already grained by month only, summed across accommodations, removes the chance of this mistake entirely.
2. **If you can't add a mart today, add a doc block for the grain specifically.** Not "this counts cancellations," but "this counts cancellations *per accommodation per month*; sum this column, grouped by month, for a portfolio-wide total."

Next pill drops the full-schema dump entirely and gives the model *only* the tables relevant to each question, the routing approach. It doesn't automatically fix this grain problem, and it introduces a new failure mode of its own.

---

> **Next up: [Pill 3: Routing — Giving the Model Only What the Question Needs](/blog/semantic-layer-pill-3-routing)**
>
> **Series: Semantic Layer Pills.** Source project: [pms-semantic-layer](https://github.com/moradabaz/pms-semantic-layer) · Full write-ups: [semantic-layer-pills](https://github.com/moradabaz/semantic-layer-pills).
