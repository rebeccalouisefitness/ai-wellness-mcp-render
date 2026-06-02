# Step 8 — Launch (All complete) (v143)

> v143 (2026-05-31) — Launch phase. The single `yes` permission gate stays (only permission gate in the entire 60-min flow, per RULE 11). Profile save is narrated in one short sentence before `save_distributor_profile` fires.
>
> v123 — step file. Hard rules inherited from master.md (router). This file holds the suggested phrasing + tool-call sequence for Phase 9 of the 11-phase flow. Step 7.5 (URL injection + flow activation) has been folded into `step-7-emails.md` in v123. This file is now JUST the launch confirmation + Phase 2 placeholder. **The operator will add Phase 2 launch hooks (persona pickers, content scripts) later — do NOT build them in v143.**

---

# PHASE 9 — Launch ("All complete. Ready to launch?")

**Trigger:** `manychat live` (or `channels connected`) — auto-fired from `step-7-emails.md`. Also accepts manual triggers: `launch`, `step 8`.

**Goal:** confirm the 60-minute build is complete, get a single `yes` from the user, and surface the Phase 2 placeholder.

---

## Suggested phrasing (ONE response)

> **All complete.** ✓
>
> Your domain is live. Your brand voice is locked in. Both team-member pages + both customer pages are on `www.{distributor_domain}`. Both forms are wired with confirmation emails + tags + automations. Both ManyChat flows are active with your URLs baked in. Every keyword (`AIbiz` / `AI biz` / `MYPLAN` / `MY PLAN`) routes leads from Instagram + Facebook + WhatsApp straight into your funnels.
>
> You're live. ✻
>
> **Ready to launch?** Type **yes** and I'll hand you Phase 2 — the content + posting cadence that brings the first real eyeballs to what we just built.

**Then do:**

- Wait for `yes` (variations: `launch`, `let's go`, `go`, `ready`, `yes please`).
- On receipt → fire the Phase 2 placeholder block below.

**On NO response within the user's session OR a `not yet` / `wait` reply:** Save progress (`save_distributor_profile` with `{ build_complete: true, launched: false, last_step: "8-publish-pending-launch" }`) and acknowledge in ONE sentence: *"Got it — your build is saved. When you're ready to launch, type `yes` and I'll pick up here."* Then HALT silent.

---

## Phase 2 placeholder (fires on `yes`)

**Suggested phrasing:**

> 🚀 You're officially LIVE.
>
> **Phase 2 launch hooks coming next** — the team is building out the content scripts, persona pickers, and 30-day posting cadence as the next layer of this skill. For now you have everything you need: your funnels are running, your ManyChat is catching every comment, your emails are firing. Post anything that feels like you — even one Reel today — and the system will pick up from there.
>
> When Phase 2 ships, type **next phase** and I'll load it in.
>
> Congratulations on building your AI Wellness business 🌿

**Then do:**

- Narrate ("Marking your build as launched and saving your profile.") then `save_distributor_profile` with `{ build_complete: true, launched: true, launched_at: <timestamp>, last_step: "9-launched-phase-2-pending" }`.
- HALT. Do NOT build content hooks. Do NOT improvise a Phase 2.
- If the user types `next phase` later → respond ONCE: *"Phase 2 isn't shipped yet — the team is finalizing the content scripts. I'll have it for you the moment it goes live."* Then HALT.

---

## HARD RULES — Phase 9

- **The "All complete" message is ONE response, not two.** Don't break it across messages.
- **The `yes` gate is the ONLY permission gate in the entire 11-phase flow** — and it's only here because it's a meaningful inflection point ("build" → "launch"). Per RULE 11, this is the exception that proves the rule. Every other "ready?" prompt anywhere else in the skill is banned.
- **DO NOT build Phase 2 content hooks in v143.** v120's Step 8 had persona pickers (busy mom / twenties / athletic guy / mid-career man / empty nester) and `get_persona_hooks(persona_id)`. That logic is REMOVED — the operator is rebuilding it. Phase 2 is a literal placeholder string.
- **`launched` event is saved to the profile** so the orchestrator / dashboard can detect builds that have completed setup vs. those mid-flow.
- **If the user types `next phase` before Phase 2 ships**, respond once + HALT. Do NOT improvise content, hooks, or strategy. Phase 2 is operator-owned.

---

**STEP COMPLETE →** On `yes` after the "All complete. Ready to launch?" message + Phase 2 placeholder fired + `launched: true` saved. The 60-minute onboarding is done. Further messages route via `master.md` re-fetch.

If the next step is unclear or the user's reply doesn't match an expected confirmation phrase, re-fetch `master.md?v=2026-05-31-v144-generic-wellness` to re-route. If unsure, re-fetch the next step file before continuing — the suggested phrasing is starting copy, but the tool-call sequence and confirmation phrases should be followed.
