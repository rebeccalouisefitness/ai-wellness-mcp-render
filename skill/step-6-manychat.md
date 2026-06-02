# Phase 7 — Emails + Tags + Automations (Kajabi MCP path — v143)

> **v143 (2026-05-31)** — Restored auto-pilot. Kajabi MCP is the primary path. One opening narration covers the whole phase ("Wiring your emails + tags + automations now — about 2 minutes."), then steps 6.1 → 6.4 run back-to-back without per-step announcement. The single manual step (one-time automation wiring in Step 6.3 until Kajabi MCP exposes `create_automation`) stays as-is.
>
> **Source of truth:** `skill/master.md` Phase 7 section, this `.kajabi-mcp.md` variant. Replaces the legacy Chrome-extension flow (filename retained from v120 — content is Emails, not ManyChat).
>
> **Why this exists:** the Chrome flow took 5-10 min per email (folder → sequence → email → HTML push → save → publish), often broke when the editor didn't render. Kajabi MCP does sequences + emails + tags directly via API — total Phase 7 in ~2 minutes.

---

# PHASE 7 — Emails + Tags + Automations via Kajabi MCP

**Trigger:** customer pages live (Phase 6 done). Also accepts manual triggers: `build emails`, `wire emails`, `emails`.

**Goal:** every form submission fires ONE confirmation email + applies the matching tag. Single CTA in each email: book the Calendly call.

**SPEED TARGET:** total Phase 7 < 2 min via Kajabi MCP. If approaching 5 min, something's wrong with the MCP transport — surface and investigate.

**ZERO USER INPUT.** Brand voice + Calendly URLs + first name come from the saved profile.

---

## Opening acknowledgement (suggested phrasing, ONE sentence — this is the narration that covers the whole phase)

> Wiring up your emails + tags + automations now — under 2 minutes, no input needed from you. ✻

Then run Steps 6.1 → 6.4 back-to-back. Don't re-announce each sub-step — the opening line is the narration. The one place the user sees a separate ask is Step 6.3 (the one-time automation wiring in Kajabi admin until Kajabi MCP exposes `create_automation`).

---

## Pre-flight — Form probe via Kajabi MCP

Before starting:

1. `kajabi.list_forms(site_id)` → look for `AI Business` and `AI Customer`.
2. **Both present** → run all four sub-steps.
3. **Only one present** → Dispatch to operator (the customer-side build in Phase 6 should have created the AI Customer form).
4. **Neither present** → Dispatch to operator + log `phase_7_no_forms`.

---

## Step 6.1 — Create the 2 tags

```
kajabi.create_tag(site_id, name: "AI Business")
kajabi.create_tag(site_id, name: "AI Customer")
```

If either returns "tag exists" (422), call `kajabi.list_tags(site_id)` and capture the existing tag's `id`. Don't duplicate.

---

## Step 6.2 — Create the 2 confirmation sequences

For each funnel:

```
seq = kajabi.create_sequence(
  site_id,
  title: "AI Business — Confirmation",   // or "AI Customer — Confirmation"
)
```

Capture the returned `sequence.id`.

Then add a single email to each sequence:

```
body_html = aiw.get_styled_template(
  template_name: "email-recruit-confirmation",    // or "email-customer-confirmation"
  brand_kit_id,
  distributor_data: { first_name, calendly_recruit_url, calendly_customer_url, kit_name, kit_primary_color }
)

kajabi.add_sequence_email(
  site_id,
  sequence_id: seq.id,
  subject: "You're in — let's book your call",   // or "...book your results call" for customer
  body: body_html,
  body_format: "html",
  send_after_days: 0,    // immediately
  status: "published",
)
```

**Token contract (locked, unchanged from Chrome variant):**
- `{{distributor_first_name}}` / `{{distributor_calendly_url}}` / `{{kit_name}}` / `{{kit_primary_color}}` — substituted by `get_styled_template`.
- `{{lead_first_name}}` LEFT LITERAL — Kajabi merges per-lead at send time using Liquid `{{ first_name }}`.
- Forbidden tokens: `{{first_name}}`, `{{calendly_url}}`, `{{unsubscribe_url}}` (Kajabi auto-injects).

**Voice:** Team-member = peer entrepreneur. Customer = coach-warm. 50–80 words each. Universal language.

**BANNED phrases (rewrite if any appear):** queen / boss babe / sis / let's gooo / level up / manifest / journey / blessed / 6-figure / passive income / financial freedom / transform / transformation.

---

## Step 6.3 — Wire form → sequence + tag (automation)

Kajabi MCP does NOT (as of v132) expose a `create_automation` tool. The form-trigger automation needs to be wired in the Kajabi admin UI:

1. Send the user a one-time message:

> Last 30-second click for you — open this link: `https://app.kajabi.com/admin/automations/new` and create two automations exactly as shown below. Both are one-trigger, two-action. Reply `done` when both are Published.
>
> **Automation 1 — AI Customer:**
> - Trigger: Form submitted → AI Customer
> - Action 1: Subscribe to sequence → AI Customer — Confirmation
> - Action 2: Add tag → AI Customer
> - Save + Publish
>
> **Automation 2 — AI Business:**
> - Trigger: Form submitted → AI Business
> - Action 1: Subscribe to sequence → AI Business — Confirmation
> - Action 2: Add tag → AI Business
> - Save + Publish

2. Wait for `done`.

> **Note:** This is the ONE place in the Kajabi MCP flow that still needs manual UI work. The rest is fully API-driven. When Kajabi adds `create_automation` to the MCP, this step becomes a 2-second API call. Watch for it in the next MCP update.

---

## Step 6.4 — Real-email end-to-end test (no user input — Claude runs the throwaway-email test)

**HARD RULE — Test with a Claude-generated throwaway email, NEVER with the user's real email.**

Procedure:

1. Generate throwaway email: `test+<distributor_slug>+<timestamp>@ai-wellness-business.netlify.app`.
2. Submit to AI Business form by hitting the form's `embed_js_url` POST endpoint OR `kajabi.list_form_submissions` after a programmatic submission. (For now, simulate via curl POST to the form's submit URL.)
3. Same throwaway, AI Customer form.
4. Wait 10 seconds for automation to fire.
5. `kajabi.search_contacts(site_id, query: throwaway_email)` → verify the contact exists with BOTH `AI Business` + `AI Customer` tags.
6. Auto-clean the test contact — Kajabi MCP doesn't expose contact-delete; if cleanup fails, leave a TODO comment and proceed.
7. Internal log: `Phase 7 e2e test passed`.

---

## Closing acknowledgement + auto-fire Phase 8

After Step 6.4 passes:

> Confirmations + tags + automations live ✓ Now ManyChat — last log-in I need from you, then we're done.

Then `aiw.save_distributor_profile` with `{ emails_live: true, last_step: "6-emails" }` and auto-fire `step-7-emails.md?v=2026-05-31-v144-generic-wellness` (filename retained — content is ManyChat install). ManyChat does NOT have an MCP yet, so Phase 8 stays on the Chrome flow.

---

## HARD RULES — Phase 7 (Kajabi MCP variant)

- **ZERO user input** (except the one-time automation wiring in Step 6.3 until Kajabi MCP ships `create_automation`).
- **Test email is throwaway, auto-generated.** Never the user's real email.
- **Both sequences published before phase done.** Drafts are not enough.
- **Token contract locked.** `{{distributor_calendly_url}}` resolves per funnel server-side.
- **No phone / SMS.** Calls only.
- **If a sequence already exists, EDIT — never duplicate.** Call `kajabi.list_sequences(site_id)` and search by title before creating.

---

**STEP COMPLETE →** On Step 6.4 e2e test pass, auto-fire Phase 8 in SAME reply — fetch `step-7-emails.md?v=2026-05-31-v144-generic-wellness` (ManyChat install content — Chrome-based, no Kajabi MCP needed here).
