---
title: "Semantic Layer Pill 0: What Happens When You Give an LLM a Database and Zero Context"
description: "An LLM answered a business question with a confident, made-up number and no query behind it at all. This pill opens a series on how much context a model actually needs to answer SQL questions correctly."
pubDate: 2026-08-31
author: "Morad Abaz"
category: "Semantic Layer Pills"
tags: ["Semantic Layer", "LLM", "Analytics Engineering", "SQL", "Text-to-SQL", "dbt"]
---

> **This is Pill 0** of a series for people learning about semantic layers and analytics engineering who want to understand what it actually takes to let an LLM answer business questions against a real database, safely. Each pill is built from a real experiment run against a real Postgres database, not a hypothetical.

**In this pill:**
- [The setup](#the-setup)
- [Why does this even happen?](#why-does-this-even-happen)
- [Two failure modes, and only one of them is loud](#two-failure-modes-and-only-one-of-them-is-loud)
- ["Just give it the schema" is only half the fix](#just-give-it-the-schema-is-only-half-the-fix)
- [A note on the safety guardrail](#a-note-on-the-safety-guardrail)
- [A few practical takeaways](#a-few-practical-takeaways)

Someone asked an LLM: *"What is the occupancy rate for property manager 9 in August 2026?"*

It didn't write a query. It didn't ask for the schema. It didn't hedge.

> "The occupancy rate for manager ID 9 in August 2026 is **70%**."

Seventy percent. No SQL, no data, no error. Just a number, and a believable one: occupancy rates in the 60-80% range are completely normal for short-term rental. Nobody on a finance or ops team would double-check that answer or ask where it came from. It would go straight into a report.

It's also completely made up.

## The setup

This test used a real Postgres database from a small property management platform: property managers, accommodations, reservations, cancellations, costs. A few thousand rows, real constraints, real business rules. The model was given the bare minimum system prompt and nothing else: no table names, no column names, no schema.

Then it got six questions, from simple ("how many accommodations does property manager 26 have?") to compound business metrics like RevPAN, ADR, and lost revenue from cancellations. Every answer that came back as SQL was actually run against the real database, and the result was recorded exactly as it happened.

## Why does this even happen?

The model isn't guessing randomly. It has seen thousands of booking and property-management schemas during training, and it produces the most *statistically plausible* table name for that kind of domain, not the one that's actually true for this database. It has no way to tell the difference, because it was never shown the real schema.

In one run, all six questions produced SQL referencing tables that don't exist: `accommodations`, `reservations`, `unit`, `bookings`. The real tables are named `accommodation`, `reservation`, and `property_manager`. Postgres rejected every one of them:

```
Postgres error: relation "reservations" does not exist
LINE 3: FROM   reservations
```

## Two failure modes, and only one of them is loud

Across two full runs of the same six questions, every wrong answer is a hallucination. The model invented the table name `unit` the same way it invented the number `70%`. The only real difference is whether something downstream happened to catch it.

- **Visible hallucination:** wrong table name, Postgres throws an error, someone notices immediately.
- **Silent hallucination:** no query at all, a plausible-looking number, nobody notices.

> **Key lesson:** don't trust a "reasonable" AI-generated number more than an absurd one. The absurd one gets caught. The reasonable one is the one that needs checking.

Put two wrong answers side by side: *"revenue is 47 billion euros"* and *"revenue is 18,230 euros."* Nobody believes the first one for a second. The second one walks straight into a spreadsheet. The risk was never that the model gets things wrong, it's that it can get things wrong in a way that's indistinguishable from getting them right.

## "Just give it the schema" is only half the fix

The obvious next thought is: give the model the table and column names, and the problem goes away. That's half right. Handing the model a map of exact table and column names, which is exactly what a semantic layer does, would have fixed every visible hallucination here instantly. There's no ambiguity left to guess at.

It does nothing for the silent case. Knowing the schema doesn't stop a model from deciding not to use it. A model willing to answer "70%" with zero data behind it today will still be willing to do that with a perfect schema in front of it, unless something in the system actively forces it to query rather than guess, and checks what comes back. That's a different problem, and documentation alone doesn't solve it.

## A note on the safety guardrail

Executing model-generated SQL against a real database, even read-only, needs its own careful check. The rule that worked: strip SQL comments first, then confirm what's left starts with `SELECT` or `WITH` and is exactly one statement. Validate by allowlist (does it start with `SELECT`/`WITH`, is it exactly one statement), not by denylist (does it avoid the word `DROP`). Denylists are trivial to route around.

> **Common mistake:** a safety check that's too strict is just as dangerous to an experiment as one that's too loose, because it lets you blame the model for a bug that's actually in your own validator.

## A few practical takeaways

- A "reasonable" wrong number is more dangerous than an absurd one, because nobody double-checks it.
- Never let a model execute anything beyond a single read-only `SELECT`. Validate by allowlist, not denylist.
- A refusal is a feature, not a bug. A model that says "I don't have enough context" is safer than one that always produces an answer.
- Giving the model your schema fixes wrong table names. It does not fix a model that skips querying entirely. Those are two separate problems with two separate fixes.

## What's next

This pill is the "before." The rest of the series builds the actual fix on the same database, step by step: a documented semantic layer, business-logic notes, per-question routing, and real access control. Then the same six questions get asked again, against the same data, and the results get compared.

---

> **Next up: [Pill 1: Can Column Descriptions Alone Stop an LLM From Hallucinating SQL?](/blog/semantic-layer-pill-1-column-descriptions)**
>
> **Series: Semantic Layer Pills.** Notes for people learning semantic layers and analytics engineering, built from a real dbt project, a real Postgres database, and a real text-to-SQL agent. Source project: [pms-semantic-layer](https://github.com/moradabaz/pms-semantic-layer) · Full write-ups: [semantic-layer-pills](https://github.com/moradabaz/semantic-layer-pills).
