---
title: "Semantic Layer Pill 4: Locking It Down With Real Access Control"
description: "Good context is not the same as real security. This pill adds a read-only database role and a row cap, gets 6/6 on the original questions, then finds four new bugs the moment new questions get asked."
pubDate: 2026-08-31
author: "Morad Abaz"
category: "Semantic Layer Pills"
tags: ["Semantic Layer", "Data Governance", "SQL", "Analytics Engineering", "LLM"]
---

> **This is Pill 4** of the Semantic Layer Pills series. Three pills in, the model has good documentation and only sees the tables its question needs. This pill adds the piece none of that covers: what is the agent actually *allowed* to do at the database level.

**In this pill:**
- [What's new here](#whats-new-here)
- [Writing the policy down before touching Postgres](#writing-the-policy-down-before-touching-postgres)
- [Building the database role, and actually trying to break it](#building-the-database-role-and-actually-trying-to-break-it)
- [The result: 6/6, verified](#the-result-66-verified)
- [Bug: ADR computed with RevPAN's formula](#bug-adr-computed-with-revpans-formula)
- [Bug: the same grain mistake, reappearing after the fix](#bug-the-same-grain-mistake-reappearing-after-the-fix)
- [Round 2: pushing past the original six questions](#round-2-pushing-past-the-original-six-questions)
- [What actually changed since Pill 0](#what-actually-changed-since-pill-0)

Good context reduces wrong answers. It does nothing about a careless or malicious query. That's a separate guarantee, and it comes from the database, not the prompt.

## What's new here

- **A dedicated, read-only database role.** Not an app-level check that politely asks the model not to write anything, a real Postgres role with `SELECT` granted on the semantic layer's schema and nothing else.
- **A hard cap on rows returned**, enforced at the driver level, independent of whether the generated SQL remembered a `LIMIT`.
- **The two routing fixes from Pill 3.**

## Writing the policy down before touching Postgres

The rules live in a plain YAML file first, the access-control equivalent of the routing config from Pill 3:

```yaml
max_rows:
  limit: 500
  reason: "no question type legitimately needs more than 613 rows..."

read_only:
  enforced: true
  forbidden_statement_types: [INSERT, UPDATE, DELETE, DROP, ALTER]

allowed_schemas: [public_marts]

forbidden_schemas:
  - schema: public_staging
    reason: "Uncurated 1:1 mirror -- no business-rule guarantees."
  - schema: public
    reason: "The operational schema the app writes to directly."

forbidden_columns:
  columns:
    - column: guest_name
      reason: "Free-text guest name -- direct PII."
    - column: email
      reason: "Direct PII."
```

Writing this down first is the point: a design decision made deliberately, not a set of permissions reverse-engineered from whatever happened to be convenient.

## Building the database role, and actually trying to break it

```sql
CREATE ROLE pms_agent WITH LOGIN PASSWORD '...';

GRANT USAGE ON SCHEMA public_marts TO pms_agent;
GRANT SELECT ON ALL TABLES IN SCHEMA public_marts TO pms_agent;

-- new tables added later stay covered automatically
ALTER DEFAULT PRIVILEGES IN SCHEMA public_marts
    GRANT SELECT ON TABLES TO pms_agent;

REVOKE ALL ON SCHEMA public, public_staging FROM pms_agent;
```

Then it got verified, not assumed: `SELECT` against the allowed schema succeeded, the exact same query against the forbidden schema failed with `permission denied`, and an `INSERT` against an allowed table failed the same way. If you're setting this up yourself, write the role, then try to break it in every direction before trusting it.

The row cap is grounded in something real, not picked round: the largest table in this database has about 5,300 rows, no legitimate question needs more than that, so 500 sits comfortably below it. And it's enforced by how many rows the driver pulls off the cursor, not by trusting the model to remember a `LIMIT` clause.

## The result: 6/6, verified

Every one of the original six questions matched a routing type and returned a result checked against a direct manual query. That clean result is the end state, not the first state. Building this surfaced two real bugs along the way.

## Bug: ADR computed with RevPAN's formula

Before the fix, the routing entry for this question only exposed raw revenue and nights columns, not the table that already had a correct, tested `adr` column. Left to reconstruct the formula itself, the model divided revenue by *available* nights instead of *occupied* nights, RevPAN's formula, not ADR's. The query ran cleanly and returned a real number for every accommodation, nearly all crushed toward zero. Nothing errored. Nothing looked obviously broken.

The fix was adding the KPI table to that routing entry, pointing the model at the place where "ADR" was already correctly defined, instead of letting it rebuild the concept from raw ingredients.

## Bug: the same grain mistake, reappearing after the fix

After fixing the routing config, re-running the exact same cancellations question, with the same fixed config and the same explicit warning not to use the grained table, produced a **second wrong answer on a fresh run**, from the same grain confusion as Pill 2 and Pill 3. On a *different* run of the same question, with identical context, the model got it right.

> **Key lesson, and the one this whole series keeps circling back to:** an LLM is not a deterministic function of its prompt. The exact same context that produces a correct answer once can produce a subtly wrong one on the next run, for the exact bug you thought you'd already closed by documenting it. Documentation lowers the odds; it does not lock the door. The only thing that catches this reliably is checking the actual number against the actual data, every time, not just the first time.

## Round 2: pushing past the original six questions

A clean 6/6 on the same six questions every pill has used is a narrow test. Six *new* questions, chosen to hit untested routing types and one question with nothing to do with this database at all, found four more real bugs immediately:

- **Two honest coverage gaps.** Two real, valid KPI columns had never had a routing entry pointing at them, so both questions correctly hit the fallback.
- **A false-positive SQL extraction.** Asked a question it correctly couldn't answer, the model's own explanation included the word "with" in an ordinary sentence. The code that extracts SQL from a response, deliberately written to accept queries starting with `WITH`, matched that word mid-sentence and tried to run it as SQL. Postgres correctly rejected it as a syntax error, but the user-facing result was a confusing database error for a question the model had actually answered correctly in plain English one line above it.
- **A silent string-literal mismatch.** A query compared a season column against `'High Season'` and `'Low Season'`, but the real column only ever holds `'HIGH'` or `'LOW'`. Neither comparison could ever be true, so the query always fell through to its default branch, and happened to print the right answer anyway, by luck, not logic.
- **The most serious one: a rigid keyword caused the model to silently answer a different question than the one asked.** A question about occupancy *rules* and cancellations didn't contain the literal word "and" that its matching keyword required, so it fell through to a generic occupancy type with no rules data in it. Rather than saying so, the model quietly substituted a different, answerable question, computed it correctly, and presented the result as if it addressed the original one.

> **Key lesson:** an honest refusal is the *safe* failure mode, say what you don't have. The dangerous failure mode is a model that, given a plausible-but-wrong context, decides to answer a nearby question instead of the one it was actually asked, without flagging that it did so.

## What actually changed since Pill 0

| | Pill 0 (no context) | This pill, original 6 | This pill, 6 new questions |
|---|---|---|---|
| Table/column hallucinations | 6 of 6 | 0 | 0 |
| Silent fabricated numbers | 1 | 0 | 0 |
| Verified correct | 0 of 6 | 6 of 6 | 2 of 6 |
| Honest fallback / refusal | 0 | 0 | 3 |
| Confidently wrong or silently substituted answer | — | 2 found while building this, fixed | 2 |

Good context and real access control turned "obviously broken, every time" into "usually right, occasionally and unpredictably wrong in a way that looks completely fine." That's real progress, and it's exactly why "the agent answered without an error" can never be the bar. Budget for verification as a permanent line item, not a phase you finish.

---

> **Next up: [Pill 5: 9 Real Errors You'll Hit Building a Semantic Layer](/blog/semantic-layer-pill-5-nine-real-errors)**
>
> **Series: Semantic Layer Pills.** Source project: [pms-semantic-layer](https://github.com/moradabaz/pms-semantic-layer) · Full write-ups: [semantic-layer-pills](https://github.com/moradabaz/semantic-layer-pills).
