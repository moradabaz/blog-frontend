---
title: "Semantic Layer Pill 5: 9 Real Errors You'll Hit Building a Semantic Layer"
description: "A hands-on catalog of nine real bugs from building a dbt semantic layer, with the exact file, line, and a query you can run against your own restored database to see the evidence yourself."
pubDate: 2026-08-31
author: "Morad Abaz"
category: "Semantic Layer Pills"
tags: ["Semantic Layer", "dbt", "Analytics Engineering", "SQL", "Data Governance"]
---

> **This is Pill 5**, the bonus round of the Semantic Layer Pills series. Same [pms-semantic-layer](https://github.com/moradabaz/pms-semantic-layer) checkout as the rest of the series. Every bug below actually happened while building it, none of them threw an error, all of them ran cleanly and looked reasonable. Instead of a command to run, this pill points you at the exact file and, where it's interesting, a query you can run against your own restored database to see the fix holding.

## The staging layer

Open [`agent_stack/dbt/models/staging/stg_accommodation.sql`](https://github.com/moradabaz/pms-semantic-layer/blob/main/agent_stack/dbt/models/staging/stg_accommodation.sql) and [`stg_reservation.sql`](https://github.com/moradabaz/pms-semantic-layer/blob/main/agent_stack/dbt/models/staging/stg_reservation.sql) in your checkout. Both are boring on purpose: one `source()`, no joins, no `WHERE`. That's the fix for two real bugs that happened before these files looked like this.

**1. A join inside a staging model.** `stg_accommodation` once had a `LEFT JOIN` to `property_manager`, added to pull in `company_name` for convenience. A staging model that joins another source stops being a faithful mirror of the table it's named after, a bug in the joined table, or a future fan-out if that table ever gets more than one row per key, silently changes what the staging model returns.

**2. A business rule filtered out data one layer too early.** `stg_reservation` once had `WHERE status = 'confirmed'`, on the theory that cancelled reservations should never count toward revenue. Run this against your own database and see why that was wrong:

```bash
docker compose exec postgres psql -U pms -d pms -c \
  "SELECT status, count(*) FROM public_staging.stg_reservation GROUP BY status;"
```

You'll see `cancelled` rows sitting right there in staging, unfiltered. A cancellation-rate KPI needs exactly those rows. Filtering them out in staging would have made that metric impossible to build later, for every downstream consumer, not just the one the rule was meant for.

## The mart layer: proration and time

**3 & 4. Technical timestamps used as business anchors.** Open [`app_development/sql/migrations/011_accommodation_listed_at.sql`](https://github.com/moradabaz/pms-semantic-layer/blob/main/app_development/sql/migrations/011_accommodation_listed_at.sql) and [`012_reservation_booked_at.sql`](https://github.com/moradabaz/pms-semantic-layer/blob/main/app_development/sql/migrations/012_reservation_booked_at.sql). Both add a real business-date column (`listed_at`, `booked_at`) because `created_at` on a bulk-seeded table just means "when the seed script ran," not a business fact. Try to break the constraint that migration 012 added:

```bash
docker compose exec postgres psql -U pms -d pms -c \
  "UPDATE reservation SET booked_at = start_date + 5 WHERE reservation_id = (SELECT min(reservation_id) FROM reservation);"
```

You should get `ERROR: new row for relation "reservation" violates check constraint "chk_reservation_booked_at"`. That's `CHECK (booked_at <= start_date)`, enforced at the schema level, so this specific mistake, a reservation "booked" after it already started, can't come back no matter what inserts the row later.

> **Common mistake:** if a "days between X and Y" calculation ever produces a negative number, the first suspect is a `created_at`/`updated_at` column standing in for a business date it was never designed to represent.

**5 & 6. Proration across month boundaries.** Open [`mart_aggregates.sql`](https://github.com/moradabaz/pms-semantic-layer/blob/main/agent_stack/dbt/models/marts/mart_aggregates.sql) and find the `month_spine`/`availability`/`occupancy_and_revenue` CTEs near the top. Find a reservation that spans two months and check it split correctly:

```bash
docker compose exec postgres psql -U pms -d pms -c \
  "SELECT reservation_id, start_date, end_date FROM reservation WHERE end_date - start_date > 5 AND date_trunc('month', start_date) <> date_trunc('month', end_date) LIMIT 1;"
```

Take that `reservation_id`'s `accommodation_id` and check `public_marts.mart_aggregates` for it across both months, both `occupied_nights` and `revenue` should be split proportionally between the two months, not dumped entirely into the start month. That's the fix for two bugs: nights only counting the start month, and revenue prorated differently than the nights it was divided by, which would have silently broken any ratio (ADR, RevPAN) built from the two.

> **Key lesson:** if two columns feed the same ratio (revenue over nights, cost over time), they need the *same* proration logic. Fixing one side and not the other doesn't just leave a bug, it manufactures a new, more subtle one.

**7. Available nights capped at "today."** In the same file's `availability` CTE, notice there's no `current_date` cap on the month-end calculation. There used to be one, on the assumption that future nights "aren't available yet," but `occupied_nights` already counts confirmed future bookings (most reservations are made well ahead of the stay), so capping availability at today made the current month's occupancy mathematically impossible, occupied nights exceeding available nights.

## Data generation

**8. A backfill fixed the past but not the future.** Open [`app_development/scripts/reservation_attempts.py`](https://github.com/moradabaz/pms-semantic-layer/blob/main/app_development/scripts/reservation_attempts.py) and find `random_date_range`:

```python
def random_date_range(nights: int, listed_at: date) -> tuple[date, date]:
    today = date.today()
    earliest = max(today - timedelta(days=DATE_RANGE_PAST_DAYS), listed_at)
```

That `max(..., listed_at)` is the fix. Migration 011 backfilled `listed_at` for every *existing* accommodation, but the simulator kept generating *new* reservations with no awareness that column existed, and eventually generated one starting before its own accommodation's `listed_at`, violating an invariant that had only ever held by historical coincidence. Confirm it holds on your database:

```bash
docker compose exec postgres psql -U pms -d pms -c \
  "SELECT count(*) FROM reservation r JOIN accommodation a USING (accommodation_id) WHERE r.start_date < a.listed_at;"
```

Expect `0`.

> **Key lesson:** a one-time backfill that establishes an invariant is not the same as an invariant that's *enforced* going forward. Fix it at the source that keeps generating data, not just in the historical rows.

## The agent layer

**9. A confidently wrong formula, built from an incomplete but real context.** Covered in full, with the exact SQL and the fix, in [Pill 4](/blog/semantic-layer-pill-4-access-control): a text-to-SQL agent computed ADR as revenue divided by *available* nights instead of *occupied* nights, RevPAN's formula, not ADR's. Syntactically perfect, no error, wrong for every accommodation.

## The pattern across all nine

Five of these bugs (3 through 7) are one lesson wearing different clothes: a technical column, a timestamp, a cap, an unprorated total, was trusted to mean something it didn't. Two more (1 and 2) are the staging-layer version of the same idea. Bug 8 is what happens when a fix addresses the data but not the thing that keeps generating more of it. Bug 9 is the same root cause one layer higher, in a prompt instead of SQL.

> **Key lesson:** none of these were hallucinations in the sense of an invented table or a fabricated number, they were all syntactically valid, ran without error, and looked reasonable. That's what makes them worth checking for on purpose: the failure mode that doesn't throw an error is the one that needs a habit of checking, not a one-time fix.

## What this teaches you

If you only read one more thing from this project, make it [01-dbt-semantic-layer-governance.md, section 7](https://github.com/moradabaz/semantic-layer-pills/blob/main/interview-prep/01-dbt-semantic-layer-governance.md#7-a-data-test-failure-found-by-accident-not-staged): a real, not staged, regression of bug 8 that appeared *after* it had already been "fixed," found by tracing data instead of guessing, with the exact root cause and how it was verified. It's the same story as bug 8 above, told with the full investigation.

---

> **Test yourself: [Pill 5 Quiz: Bugs That Never Threw an Error](/pills/semantic-layer-quiz-5)**

This closes the Semantic Layer Pills series. If you've been running each pill's commands as you went, you now have a working copy of every stage this series covers, from zero context to a routed, access-controlled agent, plus a real transcript of your own for each one. Start from [Pill 0](/blog/semantic-layer-pill-0-zero-context) if you're catching up, or browse the [full series](/blog/semantic-layer-pills).

> **Series: Semantic Layer Pills.** Source project: [pms-semantic-layer](https://github.com/moradabaz/pms-semantic-layer) · Full write-ups: [semantic-layer-pills](https://github.com/moradabaz/semantic-layer-pills).
