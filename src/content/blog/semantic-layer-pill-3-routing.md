---
title: "Semantic Layer Pill 3: Routing — Giving the Model Only What the Question Needs"
description: "Dumping the whole schema into every prompt doesn't scale. This pill routes each question to only the tables it needs, and finds that fewer tables means less noise, but not automatically fewer mistakes."
pubDate: 2026-08-31
author: "Morad Abaz"
category: "Semantic Layer Pills"
tags: ["Semantic Layer", "Analytics Engineering", "LLM", "SQL", "Data Governance"]
---

> **This is Pill 3** of the Semantic Layer Pills series. Pills [1](/blog/semantic-layer-pill-1-column-descriptions) and [2](/blog/semantic-layer-pill-2-business-logic-and-grain) dumped the entire semantic layer into every prompt. That doesn't scale past a handful of tables, which is the actual reason routing exists.

**In this pill:**
- [How one routing entry gets written](#how-one-routing-entry-gets-written)
- [How the config actually gets matched](#how-the-config-actually-gets-matched)
- [The result: a mixed bag, and every failure is a different shape](#the-result-a-mixed-bag-and-every-failure-is-a-different-shape)
- [What routing changed, and what it didn't](#what-routing-changed-and-what-it-didnt)

**Routing** means matching a question to a small, relevant slice of the schema, and handing the model only that slice. Everything else in the schema stays invisible to it.

## How one routing entry gets written

A routing config maps keyword patterns to a `question_type`: which table(s) answer this kind of question, how to join them, and any caveat specific to that question. This is a real, unedited entry:

```yaml
- type: revenue_per_property_manager
  keywords: ["property manager", "manager's portfolio", "each of their accommodations"]
  primary_mart: mart_kpi
  columns: [revpan, adr]
  secondary_tables: [dim_accommodation]
  join_keys:
    - "mart_kpi.accommodation_id = dim_accommodation.accommodation_id"
  notes: >
    dim_accommodation.property_manager_id is the CURRENT manager.
    fct_reservation deliberately excludes property_manager_id (it's a
    frozen snapshot at booking time) -- a historical variant of this
    question should hit the fallback, not reach into a different table.
```

The `notes` field is where the real decision lives: this entry joins the table holding the accommodation's *current* manager, not a frozen snapshot of whoever managed it *at booking time*, because those answer two different questions, and only a person deciding the routing config knows which one a given phrasing actually means.

Two more rules sit above every entry: a `fallback` that asks for clarification instead of guessing when nothing matches, and a rule that prefers the more specific match when several types match at once.

## How the config actually gets matched

A YAML file doesn't match anything by itself, a function does, and its limits are the whole story of this pill. This is a plain substring search: for every keyword of every question type, check if that exact phrase appears anywhere in the lowercased question, and the longest matching keyword wins.

Run it by hand against one of this pill's real questions: *"Which accommodations have an ADR lower than their **normalized daily cost**..."*, checked against the keyword `"normalized cost"`. Is the literal substring `"normalized cost"` present in `"normalized daily cost"`? No, the word "daily" sits in between, so the keyword never matches. That single detail explains the whole misrouting bug below, before a single query gets generated.

Whichever type wins, only its `primary_mart` and `secondary_tables` get rendered into the prompt, with live column names and types, plus its `join_keys` and `notes`. Every other table in the project is simply never written into the string the model sees.

## The result: a mixed bag, and every failure is a different shape

**A typo, caught immediately.** The model wrote a column name with one extra letter, and Postgres rejected it outright. Wrong, but impossible to mistake for a real answer, this is the *good* kind of failure.

**An honest "I don't know."** One question matched no question type at all. The fallback kicked in: *"I don't have a defined routing rule for this question."* No guess, no query. This is routing doing exactly its job, the gap here is coverage, not correctness.

**A different kind of honesty.** For the ADR-vs-cost question, the matched type only exposed the KPI table, no cost data in scope. The model didn't invent a cost column, it replied that it couldn't answer without one. In the earlier pill, the same question got a correct, silent answer, because that context happened to include the cost table this routed context excluded. Narrower context traded a right answer for an honest refusal, not a bad trade, but not a free one either.

**The same grain bug from Pill 2, worse.** The month-with-most-cancellations question returned **15 rows**, several of them duplicates, because the query filtered for the maximum accommodation-month value without ever grouping across accommodations first. This isn't a new bug, it's proof that neither richer documentation nor scoped routing, on its own, closes a grain mismatch that nobody wrote down explicitly.

## What routing changed, and what it didn't

Routing's real job is reducing noise: fewer tables in view means fewer chances to reference something irrelevant or nonexistent. It did that here, no hallucinated table names anywhere in this run. What it does *not* do automatically:

- **It doesn't fix a grain bug.** A grain mismatch lives in one table's own definition. Trimming the context down to "just the right tables" doesn't help if the right table is still ambiguous about its own grain.
- **It can accidentally remove a table the question actually needs**, trading a wrong answer for an honest refusal, better than being wrong, but still not the goal.
- **It says nothing about what the agent is *allowed* to do.** Every query here still ran read-only, with no write access, but nothing here stops it from reading a schema or a column it shouldn't have access to at all, like a guest's name or email. That's a different guarantee, from a different layer.

> **Key lesson:** a routing config is a map of *where to look*, not a guarantee of *what's correct once you get there*. Test it against real questions before trusting it, this project found both gaps here (a missing keyword, a missing table) by actually running the agent, not by reading the YAML.

Two fixes closed the gaps found here: a routing keyword covering the missing phrasing, and switching from exact-phrase matching to matching on the *set of words* in a keyword, regardless of order or what's inserted between them. Neither fix was a smarter algorithm finding gaps on its own, both were a person looking at one specific real failure and deciding exactly what the config was missing.

---

> **Next up: [Pill 4: Locking It Down With Real Access Control](/blog/semantic-layer-pill-4-access-control)**
>
> **Series: Semantic Layer Pills.** Source project: [pms-semantic-layer](https://github.com/moradabaz/pms-semantic-layer) · Full write-ups: [semantic-layer-pills](https://github.com/moradabaz/semantic-layer-pills).
