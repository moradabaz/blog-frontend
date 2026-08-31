---
title: "Semantic Layer Pill 3: Routing — Giving the Model Only What the Question Needs"
description: "Read a real routing config, run it against a live agent, then deliberately revert one function to its old, buggy version and watch a real misrouting bug come back on your own machine."
pubDate: 2026-08-31
author: "Morad Abaz"
category: "Semantic Layer Pills"
tags: ["Semantic Layer", "Analytics Engineering", "LLM", "SQL", "Data Governance"]
---

> **This is Pill 3** of the Semantic Layer Pills series. Same [pms-semantic-layer](https://github.com/moradabaz/pms-semantic-layer) checkout as [Pill 1](/blog/semantic-layer-pill-1-column-descriptions) and [Pill 2](/blog/semantic-layer-pill-2-business-logic-and-grain).

Pills 1 and 2 dumped the entire semantic layer into every prompt. That doesn't scale past a handful of tables, which is the actual reason routing exists: match the question to a small, relevant slice of the schema, and hand over only that.

Your checkout already ships the *fixed* version of this routing config, the bugs described below were found and closed while building it. You're going to read the mechanism, run it as-is, and then deliberately turn one fix off to watch the original bug come back, safely, on your own copy.

## Read the routing config in your checkout

Open [`agent_stack/agent_config/agent_routing.yml`](https://github.com/moradabaz/pms-semantic-layer/blob/main/agent_stack/agent_config/agent_routing.yml) and find `adr_vs_cost`:

```yaml
- type: adr_vs_cost
  keywords: ["adr vs cost", "profitability", "normalized cost", "cost per night", "is this accommodation profitable"]
  primary_mart: mart_aggregates
  secondary_tables: [dim_accommodation, mart_kpi]
  notes: >
    ADR itself is ALREADY a validated column on mart_kpi.adr -- never
    recompute ADR from raw mart_aggregates columns...
```

The `notes` field is where the real decision lives, whether to reuse an already-correct column or let the model reconstruct a formula from raw ingredients. Now open [`routing.py`](https://github.com/moradabaz/pms-semantic-layer/blob/main/agent_stack/chapters/13-live-agent/agent/routing.py):

```python
def _words(text: str) -> set[str]:
    return set(_WORD_RE.findall(text.lower()))

def match_question_type(question: str, routing_config: dict) -> dict | None:
    question_words = _words(question)
    best_type, best_word_count = None, -1
    for question_type in routing_config["question_types"]:
        for keyword in question_type["keywords"]:
            keyword_words = _words(keyword)
            if keyword_words.issubset(question_words) and len(keyword_words) > best_word_count:
                best_type, best_word_count = question_type, len(keyword_words)
    return best_type
```

This matches on the *set of words* in a keyword, regardless of order or what's inserted between them, so "normalized cost" matches a question containing "normalized daily cost" (the word "daily" doesn't break it). That's a deliberate fix. You're about to see what happens without it.

## Run it yourself

```bash
docker compose run --rm \
  -e TRANSCRIPT_PATH=/content/pill-3-transcript.md \
  live-agent python main.py
```

This runs [`main.py`](https://github.com/moradabaz/pms-semantic-layer/blob/main/agent_stack/chapters/13-live-agent/agent/main.py): for each of the original six questions, it matches a `question_type`, builds a context with only that type's tables, and asks the model. Open `local_output/pill-3-transcript.md` and check the `Matched question_type` line for each question. With the fixed config and fixed matching function, you should see every question hit a real type, not the fallback, and mostly correct answers, this is the fixed, current state of the project, chapter 13's actual shipped result.

## See the historical bug on your own machine

The code you just ran is mounted from your host into the container, so editing it takes effect immediately, no rebuild needed. Open `agent_stack/chapters/13-live-agent/agent/routing.py` and temporarily replace the whole file's matching function with the original, pre-fix version:

```python
def match_question_type(question, routing_config):
    question_lower = question.lower()
    best_type = None
    best_keyword_len = -1

    for question_type in routing_config["question_types"]:
        for keyword in question_type["keywords"]:
            if keyword.lower() in question_lower and len(keyword) > best_keyword_len:
                best_type = question_type
                best_keyword_len = len(keyword)

    return best_type
```

This is a plain substring search: the exact phrase `"normalized cost"` has to appear verbatim in the question. Save the file, then re-run the exact same command:

```bash
docker compose run --rm \
  -e TRANSCRIPT_PATH=/content/pill-3-bug-transcript.md \
  live-agent python main.py
```

Open `local_output/pill-3-bug-transcript.md` and check the question about ADR vs. normalized daily cost. Is the literal substring `"normalized cost"` present in `"normalized daily cost"`? No, the word "daily" sits in between, so the keyword never matches, and that `question_type` never even enters the comparison. You should see it fall through to a different, cost-blind type, or the fallback. **Revert the file when you're done**: `git checkout -- agent_stack/chapters/13-live-agent/agent/routing.py`.

## What actually happened when this was first found

With the old substring matcher, that same question got routed to a context with no cost data in scope, and the model didn't invent a cost column, it honestly replied that it couldn't answer without one. Compare that to Pill 1, where the same question got a correct, silent answer, because that experiment's full-schema context happened to include the cost table this routed context excluded. Narrower context traded a right answer for an honest refusal, not a bad trade, but not a free one either.

> **Key lesson:** a routing config is a map of *where to look*, not a guarantee of *what's correct once you get there*. Test it against real questions before trusting it, this exact bug was found by running the agent, not by reading the YAML.

## What this teaches you

- **Routing and access control answer two different questions.** Routing decides which tables answer a question correctly and efficiently. Scope (the next pill) decides what the agent is never allowed to touch, regardless of routing.
- **A routing entry needs a `notes` field for one reason**: to encode a decision only a person who understands the business can make, like which of two similarly-named columns is correct.
- **A fix to a matching algorithm can introduce a new kind of ambiguity.** Switching from substring to word-set matching fixed this bug, but made ties between similarly-specific keywords more likely elsewhere, a real regression covered in [Pill 4](/blog/semantic-layer-pill-4-access-control).

Go deeper in [02-agent-routing-and-scope.md](https://github.com/moradabaz/semantic-layer-pills/blob/main/interview-prep/02-agent-routing-and-scope.md): the full checklist for writing a `question_types` entry, four real findings from a domain-expert review of this exact config (not just a YAML lint), and why "marts only" access control once collided with half of this routing table before both configs were checked against each other.

---

> **Test yourself: [Pill 3 Quiz: A Map of Where to Look](/pills/semantic-layer-quiz-3)**
>
> **Next up: [Pill 4: Locking It Down With Real Access Control](/blog/semantic-layer-pill-4-access-control)**
>
> **Series: Semantic Layer Pills.** Source project: [pms-semantic-layer](https://github.com/moradabaz/pms-semantic-layer) · Full write-ups: [semantic-layer-pills](https://github.com/moradabaz/semantic-layer-pills).
