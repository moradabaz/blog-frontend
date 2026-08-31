---
title: "Semantic Layer Pill 4: Locking It Down With Real Access Control"
description: "Prove a Postgres role actually enforces read-only access with your own psql commands, then run six brand-new questions against the fixed agent and try to find the same bugs the original project found."
pubDate: 2026-08-31
author: "Morad Abaz"
category: "Semantic Layer Pills"
tags: ["Semantic Layer", "Data Governance", "SQL", "Analytics Engineering", "LLM"]
---

> **This is Pill 4** of the Semantic Layer Pills series. Same [pms-semantic-layer](https://github.com/moradabaz/pms-semantic-layer) checkout as the rest of the series, including the `pms_agent` role you created in [Pill 1](/blog/semantic-layer-pill-1-column-descriptions).

Three pills in, the model has good documentation and only sees the tables its question needs. None of that stops a careless or malicious query. That guarantee comes from the database, not the prompt, and you're going to prove it yourself with three plain `psql` commands before touching the agent at all.

## Prove the database role actually holds

The policy lives in [`agent_stack/agent_config/agent_scope.yml`](https://github.com/moradabaz/pms-semantic-layer/blob/main/agent_stack/agent_config/agent_scope.yml) first, as a design decision, before any SQL enforces it: `allowed_schemas: [public_marts]`, everything else forbidden, `max_rows: 500`, a short list of `forbidden_columns` (guest name, email, phone) that no current mart even exposes yet, written down anyway so a future mart can't add one by accident without something flagging it.

Now don't take the YAML's word for it, try to break the role you created in Pill 1:

```bash
# Should succeed: the allowed schema
docker compose exec -e PGPASSWORD=agent_dev_pw postgres \
  psql -U pms_agent -d pms -c "SELECT count(*) FROM public_marts.mart_kpi;"

# Should fail: permission denied for schema public_staging
docker compose exec -e PGPASSWORD=agent_dev_pw postgres \
  psql -U pms_agent -d pms -c "SELECT count(*) FROM public_staging.stg_reservation;"

# Should fail: permission denied for table mart_kpi
docker compose exec -e PGPASSWORD=agent_dev_pw postgres \
  psql -U pms_agent -d pms -c "INSERT INTO public_marts.mart_kpi (accommodation_id) VALUES (1);"
```

If the second and third commands fail with `permission denied`, you've just verified, not assumed, that the exact same guarantee the live agent relies on actually holds at the database engine, regardless of how any SQL the agent generates is phrased.

## Run the original six questions

```bash
docker compose run --rm \
  -e TRANSCRIPT_PATH=/content/pill-4-original.md \
  live-agent python main.py
```

This is the same command as the end of Pill 3, now you know exactly which role it's running as and exactly what that role can and can't touch. In the run behind this pill, all six questions matched a routing type and returned a result checked against a direct manual query. Yours might land 6/6 too, or it might not, and that's the actual point of the next section.

> **Key lesson:** an LLM is not a deterministic function of its prompt. While reproducing this exact question set for the write-up, the cancellation-ranking question (the same grain bug from [Pill 2](/blog/semantic-layer-pill-2-business-logic-and-grain)) came back wrong on one run and correct on another, same config, same notes, same explicit warning not to use the grain-mismatched table. Documentation lowers the odds of a mistake; it does not lock the door. If your run gets this one wrong, you haven't broken anything, you've reproduced a real, documented finding.

## Run six new questions and try to find the bugs yourself

The six questions above are the ones this whole series has used for a clean before/after comparison. That's a narrow test. This project pushed past it with six new, unremarkable questions, not adversarial, not edge cases, and found four more real bugs immediately:

```bash
docker compose run --rm \
  -e TRANSCRIPT_PATH=/content/pill-4-round2.md \
  live-agent python main_expanded.py
```

[`main_expanded.py`](https://github.com/moradabaz/pms-semantic-layer/blob/main/agent_stack/chapters/13-live-agent/agent/main_expanded.py) runs against your checkout's current, fully-fixed config, nothing reverted for this one, so whatever you see is genuinely live, not historical. Open `local_output/pill-4-round2.md` and check each question against what the project originally found:

1. *"What is the average length of stay across all accommodations?"* and *"how far in advance do guests book?"* — both real, validated `mart_kpi` columns, neither has ever had a routing entry. Expect the fallback, and check whether that's still true on your run.
2. *"Which channel has the highest cancellation rate?"* — watch for a model response that correctly says it can't answer, but includes the word "with" in its own prose (e.g. "...combine it with `mart_kpi`..."). The SQL extractor accepts anything starting with `SELECT` or `WITH`, deliberately, and can misread that word mid-sentence as the start of a query. Check whether the "Extracted SQL" line in your transcript contains real SQL or a fragment of an English sentence.
3. *"Is occupancy higher during high season or low season?"* — the real column only ever holds `'HIGH'`/`'LOW'`, but a naive query might compare against `'High Season'`/`'Low Season'`. Check whether your run's SQL uses the real values or the wrong string literals, and whether the final answer happens to be right anyway (it can be, by luck, not logic).
4. *"Do stricter occupancy rules correlate with more cancellations?"* — the routing keyword for this is the literal phrase `"occupancy rules and cancellations"`. This question doesn't contain the word "and," so check whether it falls through to a different type, and if it does, read the model's answer closely: does it say it can't answer, or does it quietly answer a different, adjacent question (like correlating occupancy *rate* instead of occupancy *rules*) without flagging the swap?

## What actually changed since Pill 0

| | Pill 0 (no context) | This pill, original 6 | This pill, 6 new questions |
|---|---|---|---|
| Table/column hallucinations | 6 of 6 | 0 | 0 |
| Silent fabricated numbers | 1 | 0 | 0 |
| Honest fallback / refusal | 0 | 0 | up to 3 |
| Confidently wrong or silently substituted answer | — | occasional (non-deterministic) | up to 2 |

> **Key lesson:** an honest refusal is the *safe* failure mode. The dangerous one is a model that, given a plausible-but-wrong context, decides to answer a nearby question instead of the one it was actually asked, without saying so. Good context and real access control turned "obviously broken, every time" into "usually right, occasionally and unpredictably wrong in a way that looks completely fine." That's real progress, and it's exactly why "the agent answered without an error" can never be the bar.

## What this teaches you

- **Enforce access at the layer that can't be bypassed.** A Postgres role's privileges are checked on every single statement, with no code path around it, unlike an application-level text check that only runs if someone remembers to call it.
- **Keep both layers anyway.** The DB role stops privilege violations; `is_read_only` (Pill 0) stops a syntactically-safe-but-undesirable statement shape the database's permission system was never designed to catch. They defend against different things.
- **`max_rows` is enforced with `fetchmany`, not by trusting the SQL to include a `LIMIT`.** Same principle as Pill 0's row cap, scaled up for a real agent.

Go deeper in [03-live-agent.md](https://github.com/moradabaz/semantic-layer-pills/blob/main/interview-prep/03-live-agent.md): the exact tie-break regression that a matching-algorithm fix introduced, why "the config was reviewed carefully" and "the agent still found new bugs when run for real" aren't a contradiction, and what "robust" actually means when it's relative to a specific set of questions you've tried.

---

> **Next up: [Pill 5: 9 Real Errors You'll Hit Building a Semantic Layer](/blog/semantic-layer-pill-5-nine-real-errors)**
>
> **Series: Semantic Layer Pills.** Source project: [pms-semantic-layer](https://github.com/moradabaz/pms-semantic-layer) · Full write-ups: [semantic-layer-pills](https://github.com/moradabaz/semantic-layer-pills).
