---
title: "Semantic Layer Pill 0: What Happens When You Give an LLM a Database and Zero Context"
description: "A hands-on guide: clone a real Postgres + dbt project, run an LLM against it with zero schema context, and watch it hallucinate. Step by step, on your own machine."
pubDate: 2026-08-31
author: "Morad Abaz"
category: "Semantic Layer Pills"
tags: ["Semantic Layer", "LLM", "Analytics Engineering", "SQL", "Text-to-SQL", "dbt"]
---

> **This is Pill 0** of a series for people learning about semantic layers and analytics engineering. This isn't a demo you read and take on faith: every pill tells you exactly how to clone the real project and run the exact same experiment yourself, on your own machine, against your own copy of the database. The project behind this whole series is [pms-semantic-layer](https://github.com/moradabaz/pms-semantic-layer); the full write-ups this series is built from live in [semantic-layer-pills](https://github.com/moradabaz/semantic-layer-pills).

Someone asked an LLM: *"What is the occupancy rate for property manager 9 in August 2026?"*

It didn't write a query. It didn't ask for the schema. It didn't hedge.

> "The occupancy rate for manager ID 9 in August 2026 is **70%**."

Seventy percent. No SQL, no data, no error. Just a number, and a believable one. Nobody would double-check that answer or ask where it came from before it goes in a report.

It's also completely made up. You're about to reproduce this yourself.

## Set up the project

You need Docker and Docker Compose installed. Everything else runs inside containers, no local Python, no local Postgres.

```bash
git clone https://github.com/moradabaz/pms-semantic-layer.git
cd pms-semantic-layer
cp .env.example .env
```

Open `.env` and fill in `OPENAI_API_KEY`. Despite the name, this project calls **NVIDIA's OpenAI-compatible endpoint** by default (`llm.py` sets `OPENAI_API_BASE_URL=https://integrate.api.nvidia.com/v1`), so grab a free key at [build.nvidia.com](https://build.nvidia.com) rather than OpenAI's own dashboard. If you'd rather use OpenAI directly, add `OPENAI_API_BASE_URL=https://api.openai.com/v1` and an appropriate `OPENAI_MODEL` to your `.env`.

Start Postgres and restore the included snapshot, so you get a real, populated database instead of waiting hours for the data simulator:

```bash
docker compose up -d postgres
docker cp db_snapshot/pms_snapshot.dump $(docker compose ps -q postgres):/tmp/pms_snapshot.dump
docker compose exec postgres pg_restore -U pms -d pms \
  --clean --if-exists --no-owner --no-privileges /tmp/pms_snapshot.dump
```

Verify it worked:

```bash
docker compose exec postgres psql -U pms -d pms -c "SELECT count(*) FROM accommodation;"
```

You should see `613`. That's the same database every pill in this series uses.

## Run it yourself

Chapter 07's demo asks the model six real business questions with nothing but a generic system prompt, no table names, no columns:

```bash
docker compose run --rm agent-demo
```

This builds the demo image, connects to the same Postgres container over the internal Docker network, asks all six questions, runs whatever SQL comes back against the real database, and writes the full transcript to `agent_stack/chapters/07-agent-without-context/transcript.md` on your machine (mounted as a volume, so you can open it in your editor once it's done).

Open that file. Look at what table names the model invented.

## What you should see

In the canonical run behind this pill, every one of the six questions produced SQL referencing tables that don't exist in this schema: `accommodations`, `reservations`, `unit`, `bookings`. The real tables are `accommodation`, `reservation`, and `property_manager`. Postgres rejected every one of them:

```
Postgres error: relation "reservations" does not exist
LINE 3: FROM   reservations
```

Because the LLM is non-deterministic, your run might not match this exactly, and that's expected, not a sign something is broken. What matters is the *shape* of the failure: either a hallucinated table name (a loud, visible error) or, occasionally, no SQL at all and a confident, plausible-sounding number instead (a silent hallucination, no error to catch it).

> **Key lesson:** don't trust a "reasonable" AI-generated number more than an absurd one. The absurd one gets caught by an error. The reasonable one is the one that needs checking.

## Try it yourself

Open [`run_demo.py`](https://github.com/moradabaz/pms-semantic-layer/blob/main/agent_stack/chapters/07-agent-without-context/demo/run_demo.py) and look at `is_read_only`. It's the safety gate before anything touches the database: strip SQL comments, then confirm what's left starts with `SELECT` or `WITH` and is exactly one statement.

- Try loosening it (e.g. checking only `"select" in sql.lower()` instead of `startswith`), rebuild the image (`docker compose build agent-demo`), and think through what a query like `SELECT 1; DROP TABLE reservation;` would do against a check like that. Don't run it against a real database, this is a thought exercise on the validator logic, not something to test destructively.
- Then look at `QUESTIONS` in the same file and add a seventh question of your own. Re-run `docker compose run --rm agent-demo` and see what the model invents for a question it's never seen before.

## What this teaches you

- **Validate by allowlist, not denylist.** Check that a query starts with `SELECT`/`WITH` and is a single statement, don't try to enumerate every dangerous keyword. Denylists are trivial to route around.
- **A refusal is a feature, not a bug.** A model that says "I don't have enough context" is safer than one that always produces an answer.
- **Giving the model your schema fixes wrong table names. It does not fix a model that skips querying entirely.** Those are two separate problems, and the rest of this series builds the fix for the first one, then spends real effort on the second.

If you want to go deeper on the guardrail side, the [interview-prep track](https://github.com/moradabaz/semantic-layer-pills/tree/main/interview-prep) built from this project has a good, concrete comparison of `fetchmany`, `LIMIT`, and Postgres' `statement_timeout` (in [04-senior-review-walkthrough.md](https://github.com/moradabaz/semantic-layer-pills/blob/main/interview-prep/04-senior-review-walkthrough.md), question 1) that's worth reading once you've run this pill: none of the three alone stops a runaway query, and knowing why is a good interview answer.

## What's next

This transcript is the "before." The rest of the series builds the actual fix, step by step, on this exact database: a documented semantic layer, business-logic notes, per-question routing, and real access control. Then the same six questions get asked again, and you'll be able to compare your own transcripts side by side.

---

> **Test yourself: [Pill 0 Quiz: What Zero Context Actually Breaks](/pills/semantic-layer-quiz-0)**
>
> **Next up: [Pill 1: Can Column Descriptions Alone Stop an LLM From Hallucinating SQL?](/blog/semantic-layer-pill-1-column-descriptions)**
>
> **Series: Semantic Layer Pills.** Source project: [pms-semantic-layer](https://github.com/moradabaz/pms-semantic-layer) · Full write-ups: [semantic-layer-pills](https://github.com/moradabaz/semantic-layer-pills).
