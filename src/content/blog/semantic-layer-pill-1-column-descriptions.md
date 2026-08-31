---
title: "Semantic Layer Pill 1: Can Column Descriptions Alone Stop an LLM From Hallucinating SQL?"
description: "Step-by-step: give the same LLM the full dbt semantic layer with one-line column descriptions, and see whether documentation alone fixes what Pill 0 broke."
pubDate: 2026-08-31
author: "Morad Abaz"
category: "Semantic Layer Pills"
tags: ["Semantic Layer", "dbt", "LLM", "Analytics Engineering", "SQL", "Text-to-SQL"]
---

> **This is Pill 1** of the Semantic Layer Pills series. If you haven't done [Pill 0](/blog/semantic-layer-pill-0-zero-context) yet, do that first, you'll need the same [pms-semantic-layer](https://github.com/moradabaz/pms-semantic-layer) checkout, Postgres running, and the snapshot restored.

The obvious fix after Pill 0 is "give it the schema." This pill tests exactly that, and only that, no routing, no per-question filtering, the entire semantic layer's documentation dumped into the prompt every time.

## One more setup step: the agent's database role

From this pill on, every experiment runs through the `live-agent` service, which connects to Postgres as a dedicated `pms_agent` role, not the superuser you used in Pill 0. This is deliberate, chapter 13 builds this role specifically so the agent can never write anywhere or read outside the curated schema, and you'll test that guarantee directly in [Pill 4](/blog/semantic-layer-pill-4-access-control). For now, you just need it to exist.

Pick a password and add it to `.env`:

```bash
echo "AGENT_DB_PASSWORD=agent_dev_pw" >> .env
```

Create the role, using the same password:

```bash
docker compose exec -T postgres psql -U pms -d pms \
  -v agent_password="agent_dev_pw" \
  -f - < agent_stack/agent_config/agent_role.sql
```

This runs [`agent_role.sql`](https://github.com/moradabaz/pms-semantic-layer/blob/main/agent_stack/agent_config/agent_role.sql) against your database: it creates `pms_agent`, grants it `SELECT` on `public_marts` only, and explicitly revokes everything on `public` and `public_staging`. You only need to do this once per database.

## Where the documentation actually lives

The semantic layer is a dbt project already built and already applied to your restored database (`public_staging` and `public_marts` both exist in the snapshot, you don't need to run `dbt build` for this pill). Its layout, on your checkout, under `agent_stack/dbt/models/`:

```
staging/    # a boring, 1:1 mirror of the raw tables — rename/cast, no logic
marts/      # the real business logic: formulas, joins, PII removal
```

Open [`agent_stack/dbt/models/marts/_marts.yml`](https://github.com/moradabaz/pms-semantic-layer/blob/main/agent_stack/dbt/models/marts/_marts.yml) in your editor and find the `adr` column on `mart_kpi`:

```yaml
- name: adr
  description: "{{ doc('adr') }}"
```

Then open [`_marts.md`](https://github.com/moradabaz/pms-semantic-layer/blob/main/agent_stack/dbt/models/marts/_marts.md) and find the block it points to:

```
{% docs adr %}
Average Daily Rate: revenue / occupied_nights. Both inputs are prorated
across month boundaries.
{% enddocs %}
```

This is standard dbt, `dbt docs generate` reads exactly this. None of it is written for an LLM yet. [`docs_dump.py`](https://github.com/moradabaz/pms-semantic-layer/blob/main/agent_stack/chapters/13-live-agent/agent/docs_dump.py) is the script that turns it into one: it resolves every `{{ doc(...) }}` reference, joins the result with live column names and types pulled straight from `information_schema`, and hands the whole thing to [`llm.py`](https://github.com/moradabaz/pms-semantic-layer/blob/main/agent_stack/chapters/13-live-agent/agent/llm.py)'s `build_system_prompt`. That function's return value is the literal text sent to the model, if you ever want to check whether your own agent is "giving the model enough context," this is the exact place to go look.

## Run it yourself

```bash
docker compose run --rm \
  -e CONTEXT_MODE=docs_short \
  -e TRANSCRIPT_PATH=/content/pill-1-transcript.md \
  live-agent python main_experiment.py
```

`CONTEXT_MODE=docs_short` tells [`main_experiment.py`](https://github.com/moradabaz/pms-semantic-layer/blob/main/agent_stack/chapters/13-live-agent/agent/main_experiment.py) to call `build_full_schema_context(..., short=True)`, the one line that keeps only the first sentence of every column's documentation. The transcript lands in `local_output/pill-1-transcript.md` on your machine (that folder is mounted into the container, gitignored, and is where every experiment in this series writes its output).

## What you should see

Open the transcript. You'll see the exact context block sent to the model, the full `public_marts` schema, every column, one sentence each:

```
Table: public_marts.mart_kpi
  - adr (numeric) -- Average Daily Rate: revenue / occupied_nights.
  ...
```

In the run behind this pill, all six of chapter 07's original questions came back correct, verified against the database directly, including the ADR question, worth remembering, because [Pill 2](/blog/semantic-layer-pill-2-business-logic-and-grain) shows the model getting a different question wrong under a very similar setup.

> **Key lesson:** a one-sentence column description that states the *formula*, not just the name, closes off an entire category of error before it can happen. Write the formula into the description, in the dbt project itself, and every tool that reads that documentation benefits, not just an LLM.

## Try it yourself

1. Open `_marts.md` and delete the formula from the `adr` doc block, leaving only *"Average Daily Rate."* Save, re-run the exact command above, and see whether the model still gets the ADR question right without the formula spelled out.
2. Put the formula back, then try `CONTEXT_MODE=docs_full` instead of `docs_short` and diff the two transcripts. You're looking at exactly what Pill 2 investigates next.

## What this teaches you

Documentation isn't decoration for a human reading a data catalog, it's a defense against a specific, already-observed failure. Every doc block worth writing in this project exists because a wrong number happened once (revenue not prorated correctly, a booking window computed from the wrong timestamp), and the description is a record of that mistake, written down specifically so a person *or a model* can't silently repeat it.

The full [interview-prep track](https://github.com/moradabaz/semantic-layer-pills/tree/main/interview-prep) built from this project goes deeper on this in [01-dbt-semantic-layer-governance.md](https://github.com/moradabaz/semantic-layer-pills/blob/main/interview-prep/01-dbt-semantic-layer-governance.md), including why `{% docs %}` blocks exist for reuse, not just length, and why schema separation (`staging` vs `marts`) is a security boundary, not tidiness.

---

> **Test yourself: [Pill 1 Quiz: Does the Model Actually See Your Docs?](/pills/semantic-layer-quiz-1)**
>
> **Next up: [Pill 2: When One-Line Descriptions Aren't Enough](/blog/semantic-layer-pill-2-business-logic-and-grain)**
>
> **Series: Semantic Layer Pills.** Source project: [pms-semantic-layer](https://github.com/moradabaz/pms-semantic-layer) · Full write-ups: [semantic-layer-pills](https://github.com/moradabaz/semantic-layer-pills).
