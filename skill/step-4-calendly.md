# Step 4 — Calendly + Zoom (v143)

> v143 (2026-05-31) — Restored auto-pilot. Each automated action (browser handoff, Zoom integration check, event creation, URL grab) gets a single sentence of narration before Claude executes. "Silent" Chrome work is now narrated work — same actions, same order, same outcome, just with the user kept in the loop. No "ready?" gates added. Calendly is still Chrome-ext driven (no Calendly MCP exists).
>
> v123-1 (2026-05-22) — User-facing URLs in retry/probe messages now rendered as clickable markdown links per the "no copy/paste" rule.
>
> v123 — step file. Hard rules inherited from master.md (router). This file holds the suggested phrasing + tool-call sequence for Phase 4 of the 11-phase flow. User logs into Calendly → types `done` → Claude verifies Zoom at the integrations page (per RULE 8) and creates both 15-min events. Step 4.5 (Calendly resume) is FOLDED INTO this file — Blocks B.0 → B.5 live here.

---

# PHASE 4 — Calendly login + 2 events

**Trigger:** kit chosen (auto, from Step 3 acknowledgement).

**Touchpoint #2 (Calendly login) — surfaces once, exactly here.**

**Suggested phrasing:**

> Now let's wire up your call calendar. **Log into Calendly** at [calendly.com](https://calendly.com) (sign up if you don't have an account — free tier is fine). Make sure you're also logged into **Zoom** at [zoom.us](https://zoom.us) in the same browser. Type **done** and I'll set up both your event types from here. ✻

**Then do:**

- Wait for `done` (variations: `logged in`, `calendar connected`, `ready`, `calendly ready`).
- On receipt: narrate ("Wiring up your two call events now — about a minute."), then `list_connected_browsers` → use index 0 → run Blocks B.0 → B.5 below.

**On success:** advance to Phase 5 (team-member pages parallel flow).
**On failure (2x retry):** Send Dispatch message to operator per Rule 3. STOP. Do not propose alternatives, manual event creation, or OAuth troubleshooting to the user.

---

## Block B.0 — Pre-flight

1. **Browser pre-check.** `list_connected_browsers` → 0 results → Dispatch to operator. ≥1 → use index 0.
2. **Calendly login probe.** `navigate` to `https://calendly.com/event_types/user/me`. `read_page` → if redirects to `/auth/login` or shows "Log in" form, the user isn't actually logged in. Re-surface ONCE:

   > Quick — make sure you're signed in to Calendly. [Open Calendly here](https://calendly.com) → log in. Reply **done** when you're in.

   On `done` → re-probe. If still signed out, Dispatch to operator.

3. **Wizard handoff.** If "Set up Google Calendar" wizard is visible with a Google email pre-filled → click `Next` / `Continue` via Chrome ext. If NO Google email pre-filled, surface this guidance *"Click 'Connect Google Calendar' on the page and complete the popup yourself. Type `done` when back."* NEVER click "Connect Google Calendar" yourself (OAuth grant is user-only).

---

## Block B.0.3 — Zoom auto-connect (per RULE 8)

**Per master.md RULE 8: the integrations page is the single source of truth for Zoom status. The event Location field's `No location set` placeholder is NEVER a signal.**

1. **Zoom login probe.** `navigate` to `https://zoom.us/profile`. `read_page` → if URL ends `/signin` or page shows "Sign in" form, surface (use as starting copy):

   > Quick — make sure you're signed in to Zoom in this browser. [Open Zoom here](https://zoom.us) → sign in. Reply **done** when you're in.

   On `done` → re-probe.

2. **Integrations page check (MANDATORY — runs every time, before any OAuth path).** `navigate` to `https://calendly.com/integrations`. `get_page_text` → locate the `Zoom` row → read the row's status label / button text:

   - **If the row contains `Connected` OR a `Disconnect` button** → Zoom is wired at the account level. Set internal flag `zoom_integration_status = "connected"`. SKIP the OAuth path. Jump to Block B.1. The user sees no extra ask — Claude proceeds straight into event creation.
   - **If the row contains a `Connect` button (and no `Connected` / `Disconnect` label)** → Zoom is NOT wired. Set internal flag `zoom_integration_status = "disconnected"`. Run the OAuth path below.
   - **If the Zoom row can't be located after 2 retries (refresh + re-grep)** → Dispatch to operator.

3. **(Only if `disconnected`) OAuth path.** `find` the Zoom row → click `Connect` → a new tab opens with the Zoom OAuth grant page. Surface ONCE (use as starting copy):

   > Zoom just opened a permission screen — click **Allow** on it to let Calendly connect to your Zoom. (I can't click that one myself.) Reply **done** once you've clicked it. ✻

   On `done`: `navigate` back to `https://calendly.com/integrations` → grep `Zoom` row → confirm `Connected`. If still `Connect`, retry once with *"The Zoom integration didn't take — try clicking Allow again, or refresh the Zoom tab. Reply `done` when it shows Connected."* After 3 retries → Dispatch to operator.

**HARD RULE (RULE 8 reinforced):** This block is the ONLY authority on Zoom integration status. The event Location field's `No location set` placeholder is the default for new events and means NOTHING about Zoom. NEVER decide Zoom is disconnected from anything other than this integrations-page check.

---

## Block B.1 — Create both events

**Ordering rule (MANDATORY):** Before opening the event editor for EITHER event, Block B.0.3 step 2 (integrations-page check) MUST have already run for this session. If `zoom_integration_status` flag is unset, run it NOW.

**Branching based on `zoom_integration_status`:**

- `connected` → proceed with event creation. In each event, when the Location field is reached: `find` Location → `left_click` to open the dropdown → `left_click` `Zoom` from the options → save. Do NOT pause, do NOT surface any Zoom-related ask to the user, do NOT re-check integrations.
- `disconnected` → Block B.0.3 step 3 must already have run and step 3's verify must have confirmed `Connected`. If somehow we got here while still disconnected, jump back into B.0.3 step 3. NEVER continue into the editor with `disconnected` status.

Narrate ONCE at the start of this block — single sentence: *"Creating your customer call + team-member call now."* — then run Event 1 and Event 2 back-to-back without per-event re-announcement.

**Event 1 — New Customer Call:**
- 15 min · lavender color
- Location = Zoom (auto-picked from dropdown per ordering rule above)
- Description: *"A free 15-minute call to map out your wellness goals + the right plan for you."*
- Save. Then run Block B.2 link-grab → `{{calendly_customer_link}}`. Save `last_step: "4.3-recruit-event-created"`.

**Event 2 — New Team Member Call:**
- 15 min · sage green color
- Location = Zoom (auto-picked from dropdown per ordering rule above)
- Description: *"A free 15-minute call to chat about whether the AI Wellness Ambassador opportunity is the right fit for you."*
- Save. Then run Block B.2 link-grab → `{{calendly_recruit_link}}`. Save `last_step: "4.4-customer-event-created"`.

**Banned in B.1:** Surfacing any "confirm Zoom is connected" / "your event has no location set — please reconnect Zoom" / "let's wire up Zoom" message based on the event Location field's placeholder. The placeholder defaults to `No location set` on every new event regardless of Zoom integration status — it is NEVER a signal. If the dropdown doesn't show `Zoom` as an option, that's the integrations-page check failing — go back to B.0.3 step 2, NOT to a user-facing ask.

Auto-retry 3x (refresh → alt selector → scroll into view). After 3 failed: Dispatch to operator.

---

## Block B.2 — Auto-grab Calendly public URLs

**HARD RULE — NEVER ask the user to copy/paste their Calendly URL.** The skill grabs both event URLs programmatically from the DOM via Chrome ext. Banned phrasing: "What's your Calendly link?" / "Paste your Calendly URL here." The user's first sight of their Calendly link is when it's already embedded in their live team-member page.

**Procedure (per event, repeat for both — Claude executes, no extra user-facing message):**

1. **Land on event-type detail page.** After Save in B.1, Calendly redirects to `https://calendly.com/event_types/<event_id>/edit`. `read_page` to confirm event detail loaded.

2. **Construct the public URL.** Calendly public URLs follow `https://calendly.com/<username>/<event-slug>`. Get both halves via `javascript_tool`:

   ```javascript
   (() => {
     const username = (document.querySelector('[data-testid*="user"], a[href*="calendly.com/"]')?.href || '').match(/calendly\.com\/([^/?#]+)/)?.[1]
       || (window.location.pathname.match(/^\/users\/([^/]+)/)?.[1]);
     const linkInput = document.querySelector('input[value*="calendly.com/"], input[readonly][value*="/"]');
     const sharedHref = document.querySelector('a[href*="calendly.com/"][href*="/"]:not([href*="event_types"])')?.href;
     const fromInput = linkInput?.value;
     const candidate = fromInput || sharedHref;
     if (candidate && /^https:\/\/calendly\.com\/[^/]+\/[^/?#]+/.test(candidate)) return { ok: true, url: candidate };
     const slugField = document.querySelector('input[name*="slug" i], [data-testid*="slug"] input');
     if (username && slugField?.value) return { ok: true, url: `https://calendly.com/${username}/${slugField.value}` };
     return { ok: false, error: 'no_url_found', username, hasInput: !!linkInput, hasShared: !!sharedHref };
   })();
   ```

3. **Persist to profile.** For Event 1 → `calendly_customer_url`. For Event 2 → `calendly_recruit_url`. Call `save_distributor_profile` with both URLs once both events are created.

---

## Block B.5 — Time zone + availability

Set the user's time zone (probe via `Intl.DateTimeFormat().resolvedOptions().timeZone` from the page context). Default availability: Mon–Fri 9 AM – 6 PM in their time zone. Save.

---

## Done → auto-fire Phase 5

After Block B.5 completes successfully:

- `save_distributor_profile` with `{ calendly_recruit_url, calendly_customer_url, last_step: "4-calendly" }`.
- Fire (suggested phrasing, ONE sentence):

  > Calendar wired ✓ — both events live, Zoom auto-attached, links saved. Building your team-member page now — about 2 minutes.

- Auto-fire `step-5-recruit-build.md?v=2026-05-31-v144-generic-wellness` in the SAME reply. No "ready?" prompt.

---

## HARD RULES — Phase 4

- **Touchpoint is "log into Calendly + Zoom".** That's the ONLY user action. Event creation, time-zone setting, availability config, URL capture — all Claude.
- **Per RULE 8:** integrations page only. Do NOT infer Zoom status from the event Location field.
- **Per RULE 9:** never ask the user for their Calendly URL. Auto-grab from DOM.
- **Auto-advance to Phase 5 in the SAME reply** once both events + Zoom + URLs are captured. No "next?" / "ready?" / "ok to continue?" gate.
- **v143 narration pattern:** one short sentence before each automated block (event creation, URL grab, time-zone set). Don't narrate every individual tool call — narrate the block.

---

**STEP COMPLETE →** On Blocks B.0–B.5 success + both Calendly URLs saved, auto-fire Phase 5 in SAME reply — fetch `step-5-recruit-build.md`.

If the next step is unclear or the user's reply doesn't match an expected confirmation phrase, re-fetch `master.md?v=2026-05-31-v144-generic-wellness` to re-route. If unsure, re-fetch the next step file before continuing — the suggested phrasing is starting copy, but the tool-call sequence and confirmation phrases should be followed.
