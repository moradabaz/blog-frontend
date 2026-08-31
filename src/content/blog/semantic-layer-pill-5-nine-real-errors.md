---
title: "Semantic Layer Pill 5: 9 Real Errors You'll Hit Building a Semantic Layer"
description: "A catalog of nine real bugs from building a dbt semantic layer: staging-layer mistakes, proration bugs, and a data generator that violated its own invariant. None of these threw an error."
pubDate: 2026-08-31
author: "Morad Abaz"
category: "Semantic Layer Pills"
tags: ["Semantic Layer", "dbt", "Analytics Engineering", "SQL", "Data Governance"]
---

> **This is Pill 5**, the bonus round of the Semantic Layer Pills series. Every bug below actually happened while building the dbt semantic layer used across this whole series. None of them threw an error, all of them ran cleanly and looked reasonable. That's exactly what makes them worth cataloging.

**In this pill:**
- [The staging layer](#the-staging-layer)
  - [1. A join inside a staging model](#1-a-join-inside-a-staging-model)
  - [2. A business rule filtered out data one layer too early](#2-a-business-rule-filtered-out-data-one-layer-too-early)
- [The mart layer: proration and time](#the-mart-layer-proration-and-time)
  - [3. A technical timestamp used as a business anchor](#3-a-technical-timestamp-used-as-a-business-anchor)
  - [4. The same pattern, again, for booking windows](#4-the-same-pattern-again-for-booking-windows)
  - [5. Occupied nights only counted a reservation's start month](#5-occupied-nights-only-counted-a-reservations-start-month)
  - [6. Revenue prorated differently than the nights it was divided by](#6-revenue-prorated-differently-than-the-nights-it-was-divided-by)
  - [7. Available nights capped at "today," inconsistent with confirmed future bookings](#7-available-nights-capped-at-today-inconsistent-with-confirmed-future-bookings)
- [Data generation](#data-generation)
  - [8. A backfill fixed the past but not the future](#8-a-backfill-fixed-the-past-but-not-the-future)
- [The agent layer](#the-agent-layer)
  - [9. A confidently wrong formula, built from an incomplete but real context](#9-a-confidently-wrong-formula-built-from-an-incomplete-but-real-context)
- [The pattern across all nine](#the-pattern-across-all-nine)

They're grouped by the layer they lived in, because the layer tells you where to look for the same bug in your own project.

## The staging layer

dbt's staging layer is supposed to be a boring, 1:1 mirror of a raw source: rename a column, cast a type, nothing more. Both bugs here came from breaking that rule "just a little."

### 1. A join inside a staging model

A staging model over the accommodation table had a join added to pull in the manager's company name, for convenience. A staging model that joins another source stops being a faithful mirror of the table it's named after: a bug in the joined table can now silently change what this one returns. It also hides a duplication risk one layer earlier than anyone would think to check, if the joined table ever has more than one row per key, the join silently duplicates rows.

**The fix:** staging stays scoped to its own source, full stop. A mart that needs data from two tables joins two staging models explicitly, at the mart layer, where joins are supposed to happen.

### 2. A business rule filtered out data one layer too early

A staging model filtered out cancelled reservations, on the reasonable-sounding theory that cancelled reservations should never count toward revenue. But that rule is specific to *revenue*, and a filter in staging doesn't just apply a rule, it deletes information for every downstream consumer, including ones the rule was never meant for. A cancellation-rate metric built later needed exactly those rows.

**The fix:** staging keeps every row, unfiltered, always. The filter gets applied explicitly inside whichever mart actually computes revenue.

## The mart layer: proration and time

The next four bugs all involve months. Any monthly metric built from reservations that can span a month boundary has to prorate consistently, get one side of that consistency wrong and the numbers still look plausible.

### 3. A technical timestamp used as a business anchor

A mart needed to know how many nights an accommodation had been available for, anchored to when it was listed. The obvious column, a `created_at` timestamp, turned out to be a lie for this purpose: every accommodation had been bulk-inserted in a single seed run, so `created_at` really meant "when the seed script ran," not "when this listing went live." Most reservations started *before* their own accommodation's `created_at`.

**The fix:** added a real `listed_at` column, backfilled to before each accommodation's earliest real reservation.

### 4. The same pattern, again, for booking windows

A "booking window" metric (days between booking and check-in) used `start_date - created_at`. For historical rows, this came out negative, a reservation "booked" after it had already started. Same root cause as bug 3, different column.

**The fix:** added a real `booked_at` column, with a database-level check constraint so this exact failure mode can't come back.

> **Common mistake:** if a "days between X and Y" calculation ever produces a negative number, the first suspect is a `created_at` or `updated_at` column standing in for a business date it was never designed to represent.

### 5. Occupied nights only counted a reservation's start month

A reservation spanning, say, August 28 to September 9 had all its nights attributed to August, none to September, because the model grouped by the reservation's start-date month instead of splitting nights across every month the stay actually touches.

**The fix:** cross-join every reservation against a month spine, and compute the overlap between the stay and each specific month.

### 6. Revenue prorated differently than the nights it was divided by

Once bug 5 was fixed, occupied nights were correctly split across months, but revenue was still attributed entirely to the reservation's start month. For a cross-month stay, that meant a ratio like ADR (revenue divided by nights) used a numerator and denominator counted over *different* sets of nights, silently producing a wrong result.

> **Key lesson:** if two columns feed the same ratio (revenue over nights, cost over time, spend over clicks), they need the *same* proration logic. Fixing one side and not the other doesn't just leave a bug, it manufactures a new, more subtle one.

### 7. Available nights capped at "today," inconsistent with confirmed future bookings

Available nights for the current month were capped at today's date, on the assumption that future nights "aren't available yet." But occupied nights already counted confirmed nights in the future, since most bookings happen well ahead of the stay, so for the current month, occupied nights could exceed available nights, an invariant that should never break.

**The fix:** removed the cap entirely. A month's capacity exists whether or not those calendar days have elapsed yet.

## Data generation

### 8. A backfill fixed the past but not the future

After fixing bug 3 (adding `listed_at`), the data simulator kept generating new reservations with random start dates, unaware that `listed_at` now existed. It eventually generated a reservation starting *before* its own accommodation's `listed_at`, violating an invariant that had only ever held by historical coincidence, not by design.

**The fix:** the generator's date logic now takes `listed_at` as a parameter and clamps against it. Fixed at the source that creates the data, not with a wider tolerance on whatever test caught it downstream.

## The agent layer

### 9. A confidently wrong formula, built from an incomplete but real context

A text-to-SQL agent, given real but incomplete schema context, computed ADR as revenue divided by *available* nights, RevPAN's formula, not ADR's. Syntactically perfect, no error, wrong for every accommodation. This one gets the full story, with the exact SQL and the fix, in [Pill 4](/blog/semantic-layer-pill-4-access-control).

## The pattern across all nine

Five of these bugs (3 through 7) are one lesson wearing different clothes: **a technical column, a timestamp, a cap, an unprorated total, was trusted to mean something it didn't.** Two more (1 and 2) are the staging-layer version of the same idea, a column or a filter placed one layer earlier than its actual meaning belonged. Bug 8 is what happens when a fix addresses the data but not the thing that keeps generating more of it. And bug 9 is the same root cause showing up one layer higher, in the prompt handed to an LLM instead of the SQL handed to a database.

> **Key lesson:** none of these were hallucinations in the sense of an invented table or a fabricated number, they were all syntactically valid, ran without error, and looked reasonable. That's what makes them worth writing down: the failure mode that doesn't throw an error is the one that needs a habit of checking, not a one-time fix.

---

This closes the Semantic Layer Pills series. Start from [Pill 0](/blog/semantic-layer-pill-0-zero-context) if you're catching up, or browse the [full series](/blog/semantic-layer-pills).

> **Series: Semantic Layer Pills.** Source project: [pms-semantic-layer](https://github.com/moradabaz/pms-semantic-layer) · Full write-ups: [semantic-layer-pills](https://github.com/moradabaz/semantic-layer-pills).
