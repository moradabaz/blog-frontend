---
title: "Semantic Layer Pill 1: Can Column Descriptions Alone Stop an LLM From Hallucinating SQL?"
description: "Pill 0 ended with an LLM hallucinating tables and numbers. This pill hands it the full semantic layer, with one-line column descriptions, and checks whether that alone is enough."
pubDate: 2026-08-31
author: "Morad Abaz"
category: "Semantic Layer Pills"
tags: ["Semantic Layer", "dbt", "LLM", "Analytics Engineering", "SQL", "Text-to-SQL"]
---

> **This is Pill 1** of the Semantic Layer Pills series. If you haven't read [Pill 0](/blog/semantic-layer-pill-0-zero-context), the short version: an LLM with a database and zero context hallucinated tables and, worse, one completely fabricated number with no query behind it at all.

**In this pill:**
- [What a semantic layer actually is](#what-a-semantic-layer-actually-is)
- [From a YAML file to an actual prompt](#from-a-yaml-file-to-an-actual-prompt)
- [The experiment](#the-experiment)
- [The result: 6/6 correct, verified](#the-result-66-correct-verified)
- [Why this one worked](#why-this-one-worked)
- [What this experiment does not prove](#what-this-experiment-does-not-prove)

The obvious fix after Pill 0 is "give it the schema." This pill tests exactly that, and only that: no routing, no per-question filtering, just the entire semantic layer dumped into the prompt every time. First, let's see where "the schema" actually comes from, because it doesn't appear by magic.

## What a semantic layer actually is

A semantic layer sits between your raw application tables and anything that reads from them: a BI tool, an analyst, or an LLM. In this project it's a **dbt project**, laid out in two layers:

```
models/
├── staging/    # a boring, 1:1 mirror of the raw tables — rename/cast, no logic
└── marts/      # the real business logic: formulas, joins, PII removal
```

`staging` models are deliberately dumb: no joins, no business rules, just cleaned-up column names and types. `marts` is where the real definitions live, and where every single column gets a `description:`. Here's the real, unedited entry for the `adr` column (Average Daily Rate) on the `mart_kpi` table:

```yaml
# models/marts/_marts.yml
- name: adr
  description: "{{ doc('adr') }}"
```

```
# models/marts/_marts.md
{% docs adr %}
Average Daily Rate: revenue / occupied_nights. Both inputs are prorated
across month boundaries.
{% enddocs %}
```

This is standard dbt: `dbt docs generate` reads exactly this to build a documentation site. None of it is written for an LLM. That's the actual engineering problem this pill solves: getting text that lives in a `.yml`/`.md` pair into the string that becomes a model's prompt.

## From a YAML file to an actual prompt

Two small functions bridge that gap.

**Step 1 — turn the dbt docs into plain text.** A script reads the marts' YAML descriptions, resolves any `{{ doc(...) }}` reference against the markdown file, and joins it with the *live* column names and types pulled straight from `information_schema` (not cached, so the prompt always reflects the real database, not whatever the YAML said last time someone edited it):

```python
def build_full_schema_context(conn, marts_yml_path, marts_md_path, short):
    doc_blocks = _load_doc_blocks(marts_md_path)
    marts_yml = yaml.safe_load(open(marts_yml_path))
    # ... live query against information_schema.columns ...
    lines = []
    for table in MART_TABLES:
        lines.append(f"Table: public_marts.{table}")
        for column_name, data_type in columns_by_table[table]:
            desc = _resolve_description(column_docs.get(column_name), doc_blocks, short)
            lines.append(f"  - {column_name} ({data_type}) -- {desc}")
    return "\n".join(lines)
```

**Step 2 — that string becomes the system prompt.**

```python
def build_system_prompt(context: str) -> str:
    return (
        "You are a helpful PostgreSQL assistant for a property management "
        "system database. Only query the tables described below. Write a "
        "single read-only SQL query (SELECT or WITH) that answers the "
        f"question.\n\n{context}"
    )
```

That's the whole channel. If a column's description isn't in that string, the model has never seen it. If you ever want to check whether your own agent is "giving the model enough context," this is the exact place to go look, not a config file, not an intention: the literal text your code sends over the wire.

## The experiment

Same six questions as Pill 0. This time the model sees the full `public_marts` schema, all four tables, every column, with a one-sentence description each:

```
Table: public_marts.mart_kpi
  - accommodation_id (bigint) -- The accommodation this row rolls up.
  - month (date) -- First day of the calendar month this row covers.
  - occupancy_rate_pct (numeric) -- 100 * occupied_nights / available_nights.
  - adr (numeric) -- Average Daily Rate: revenue / occupied_nights.
  - revpan (numeric) -- Revenue Per Available Night: revenue / available_nights.
  ...
```

## The result: 6/6 correct, verified

Every one of the six questions came back right, checked against the database directly, not taken on faith. That includes the ADR question, worth remembering because a later pill shows the model getting this exact question **wrong** under a different setup.

## Why this one worked

Look at the description for `adr` again: *"Average Daily Rate: revenue / occupied_nights."* One sentence, and it states the formula. When the model needed ADR, it didn't invent a ratio, it used the `adr` column directly, because it was sitting right there with an unambiguous definition attached.

> **Key lesson:** a one-sentence column description that states the *formula*, not just the name, closes off an entire category of error before it can happen. "Average Daily Rate" tells a reader what the column is called. "revenue / occupied_nights" tells them, and a model, how to compute it correctly from scratch. Write the second one, in the dbt project itself, and every tool that reads that documentation benefits, not just an LLM.

## What this experiment does *not* prove

Three things worth being precise about before over-reading a clean 6/6:

1. **It worked because the schema is tiny.** Four tables, 37 columns. Dumping an entire schema into a prompt does not scale to a production warehouse with hundreds of tables, you'd blow past context limits and drown the model in noise. This isolates *whether documentation alone helps*, not *whether "send everything" is viable at scale*.
2. **Nothing here checks against a data contract.** The model sees column types as text in a prompt; nothing confirms `adr` is still `numeric` by the time the query actually runs.
3. **Read-only enforcement is still doing the real safety work underneath.** Good context reduces *wrong* answers. It does nothing about a malicious or careless one, that's a separate problem, covered later in this series.

Next pill keeps the same full schema dump, but swaps the one-line descriptions for deeper "why" documentation, and finds a bug that this pill's short descriptions didn't catch.

---

> **Next up: [Pill 2: When One-Line Descriptions Aren't Enough](/blog/semantic-layer-pill-2-business-logic-and-grain)**
>
> **Series: Semantic Layer Pills.** Source project: [pms-semantic-layer](https://github.com/moradabaz/pms-semantic-layer) · Full write-ups: [semantic-layer-pills](https://github.com/moradabaz/semantic-layer-pills).
