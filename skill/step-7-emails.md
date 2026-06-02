# Step 7 — ManyChat Flow Install (both flows + activate + URL inject) (v143)

> v143 (2026-05-31) — Restored auto-pilot. ManyChat has no MCP, so this phase stays Chrome-ext driven — but each automated block (install flow, verify triggers, inject URL) gets a single sentence of narration before Claude executes. The user watches it happen instead of guessing what Claude is doing. No "ready?" gates added.
>
> v123-1 (2026-05-22) — User-facing ManyChat upgrade URL now rendered as a clickable markdown link per the "no copy/paste" rule.
>
> v123 — step file. Hard rules inherited from master.md (router). This file holds the suggested phrasing + tool-call sequence for Phase 8 of the 11-phase flow. **Filename retained from v120 routing** — content is ManyChat install + activation + URL injection (NOT Emails). Step 7.5 from v120 has been FOLDED INTO this file in v123 — install + activate + URL inject all live here.

---

# PHASE 8 — ManyChat install (both flows, end-to-end)

**Trigger:** emails live + auto-fired from `step-6-manychat.md`. Also accepts manual triggers: `manychat`, `install manychat`, `emails live`.

**Touchpoint #6 (ManyChat login) — surfaces once, exactly here. LAST user touchpoint in the entire 60-min flow.**

**Goal:** install BOTH canonical ManyChat flows into the user's account via Permanent Install Links, verify the 3 required triggers per flow, and substitute the user's own landing-page URL into the "Get Started" message block of each flow.

**Two flows, both ACTIVE by end of phase:**

- **AI Business (team-member side)** — installs from `MANYCHAT_AI_BIZ_TEMPLATE_URL`.
- **AI Customer / My Plan (customer side)** — installs from `MANYCHAT_CUSTOMER_TEMPLATE_URL`.

---

## Touchpoint #6 — ManyChat login + Instagram connect (suggested phrasing)

**Suggested phrasing (ONE response):**

> Last step — **log into ManyChat** at [manychat.com](https://manychat.com). If you don't have an account, sign up (free is fine to start). Then **connect your Instagram** inside ManyChat so the flows can fire on IG comments + DMs. Type **done** when you're logged in AND Instagram is connected. ✻

Save `last_step: "8.1-manychat-login-asked"`.

**Then do:**

- Wait for `done` (variations: `ready`, `logged in`, `manychat ready`, `instagram connected`).
- On receipt: narrate ("Checking your ManyChat + Instagram connection now."), then `navigate` to `https://app.manychat.com` → verify Instagram is connected (look for IG profile in the channel list). If IG not connected, surface ONCE: *"One last thing — head to **Settings → Channels** in ManyChat and connect your Instagram account. The flows need to be tied to your IG to fire. Type `done` when connected."* Save `last_step: "8.2-manychat-logged-in"`.
- After IG verified: save `last_step: "8.3-instagram-connected"`. Narrate ONCE ("Installing both ManyChat flows + wiring your URLs now — about 90 seconds."), then proceed through Steps 7.1 → 7.5 below without per-step announcement.

**On failure (2x retry on login probe):** Dispatch to operator per Rule 3. STOP.

---

## Step 7.1 — Constants

```
MANYCHAT_AI_BIZ_TEMPLATE_URL   = "https://app.manychat.com/flowPlayerPage?share_hash=1877018_acdd516bfe26ab5ffa4d0d154b22377a8d3d5abe"
MANYCHAT_CUSTOMER_TEMPLATE_URL = "https://app.manychat.com/flowPlayerPage?share_hash=1877018_5c6d7d5c343e2e93b89286c94195c44a8e033af6"
```

---

## Step 7.2 — Pro-tier check (only if a flow step requires it)

**v132 change:** Pro is NO LONGER a hard gate at the start. Free tier handles basic flow installs. Pro is only prompted at the moment a specific flow feature requires it (e.g., advanced conditional logic, specific channel features). Install both flows first on free tier — if a step fails with a "requires Pro" error, surface ONCE:

> One step in your flow needs ManyChat Pro to fire. [Upgrade in ManyChat Billing here](https://app.manychat.com/settings/billing) when you're ready. The rest of the flow is live on the free tier — Pro just adds the {{specific_feature}}. Type **manychat pro** when you've upgraded and I'll finish wiring it.

On `manychat pro`: re-check + complete the Pro-required step. If not upgraded, continue with the free-tier-compatible version of the flow + log `phase_8_pro_skipped`.

---

## Step 7.3 — Install both flows (Claude executes — single narration covers both installs)

**(3a) AI Business install.** Open new tab to `MANYCHAT_AI_BIZ_TEMPLATE_URL`. Wait for install page → `find` **Install** button → `left_click` → wait for confirmation toast.

**(3b) AI Customer install.** Open new tab to `MANYCHAT_CUSTOMER_TEMPLATE_URL`. Wait for install page → `find` **Install** button → `left_click` → wait for confirmation toast.

**(3c) Verify both installs.** Navigate `/automation/flows`. Confirm both flow names present (AI Business / AI Customer / My Plan).

**Install gotchas (HARD RULES):**
- **Channel connection is manual + per-account.** OAuth in the user's browser only. If a channel-connect modal appears, leave it for Step 7.5 — do NOT click Allow yourself.
- **Template Protection OFF** on source templates so wellness business owners can edit. Confirm OFF before generating each install link (Dispatch to operator if Template Protection is ON — wellness business owners can't edit, breaks downstream URL injection).
- **Install order matters only if a flow fails.** If AI Business install errors, skip to AI Customer install and Dispatch the AI Business failure — do not block the customer side.

---

## Step 7.4 — Activate flows + URL injection (folded in from v120 Step 7.5)

For EACH of the two flows (AI Business + AI Customer):

### 7.4a — AI Business Opportunity flow

Navigate to ManyChat → `Automation` → open the **Imported Automations** folder → open **AI Business Opportunity** automation → click **Edit Automation**.

**Verify the 3 required triggers exist and are ON:**

- **A. User Applies to Story** — fires when someone reacts to a story.
- **B. User Replies to Post/Reel/Comment** — scope: **ANY post** (never a specific post).
- **C. User Sends Message** — keywords `AIbiz` AND `AI biz`.

For each of the 3 triggers (Chrome ext driven; covered by the Step 7.3 opening narration — don't re-announce per trigger):

1. **Check if trigger node exists** via `read_page` / DOM inspection.
2. **If MISSING:** click **+ Add Trigger** → select the matching type from the picker. For trigger B, set scope to **Any post**. For trigger C, add BOTH keywords `AIbiz` and `AI biz` on separate lines.
3. **If PRESENT:** open the trigger → verify configuration matches (scope = Any post for B; both keywords present for C; if a keyword is missing, ADD it).
4. **Hit Save on every trigger** to turn it ON.

Continue only when all 3 triggers show as ON.

**Inject the user's URL.** Find the Send Message block titled **"It's all yours / Get Started"** in the flow canvas. Click the **Get Started** button inside that message → edit the URL field → set to `https://www.{distributor_domain}/ai-wellness-business` (from saved profile). Hit **Save**.

### 7.4b — AI Customer / My Plan flow

Same procedure as 7.4a — run the 3-trigger verify-add-save logic, then URL injection — with these substitutions:

- Automation name: **AI Customer** (or **My Plan**, depending on import label — accept either).
- Trigger C keywords: `MYPLAN` AND `MY PLAN` (both required, case-insensitive).
- Get Started URL: `https://www.{distributor_domain}/ai-wellness-customer`.

Triggers A and B identical to AI Business flow (A = User Applies to Story; B = User Replies to Post/Reel/Comment, scope = Any post).

---

## Step 7.5 — Verify both flows live + auto-fire Phase 9

1. Navigate `/automation/flows` → verify both flows show **ACTIVE** badge.
2. `save_distributor_profile` with `{ manychat_live: true, last_step: "7-manychat-install" }`.
3. Fire (suggested phrasing, ONE sentence — no "ready?" prompt):

   > Both ManyChat flows are LIVE with your URLs baked in ✓ Team-member triggers on `AIbiz` / `AI biz`. Customer triggers on `MYPLAN` / `MY PLAN`. Everything is built. Last thing — channels.

4. Surface ONCE (this is part of the SAME closing message above, not a separate ask):

   > Connect your channels in ManyChat → **Settings → Channels** → Instagram / Facebook / WhatsApp (whichever you use). Type **manychat live** when channels are connected and I'll launch you.

5. Wait for `manychat live` (variations: `channels connected`, `done`, `live`, `connected`).
6. On receipt → auto-fire `step-8-publish.md?v=2026-05-31-v144-generic-wellness` in SAME reply.

---

## HARD RULES — Phase 8

- **Touchpoint #6 (ManyChat login) is the LAST user action of the 60-min flow.** After this, only channels-connect (which is part of the same touchpoint — they're already in ManyChat). NO 7th touchpoint.
- **Permanent Install Link only carries over the User-Sends-Message trigger.** Triggers A (Apply Story) and B (Post/Reel/Comment reply) DO NOT transfer with the install. Claude MUST verify all 3 triggers exist and ADD any that are missing — never skip, never ask the user.
- **Trigger B scope = ANY post, NEVER specific.** Avoids per-user asset selection.
- **Trigger C keywords by flow:** AI Business = `AIbiz` + `AI biz`. AI Customer = `MYPLAN` + `MY PLAN`. If only one keyword is on the installed trigger, ADD the missing one — don't replace.
- **The user never touches the flow editor.** All trigger saves + keyword adds + URL edits via Chrome ext driven by Claude.
- **v143 narration pattern:** one short sentence at the START of Step 7.3 (covers install + verify + URL injection of BOTH flows). Don't narrate per flow or per trigger — that becomes noise. The opening line is the contract.
- **Pre-configured triggers come over OFF.** Hitting Save on each turns them ON without re-configuring.
- **URL substitution uses `distributor_domain`** (not `distributor_slug`).
- **"Template not found" on install** = source template owner forgot to tick "Allow viewers to clone this Automation" on the Share Automation dialog. Dispatch immediately — do not prompt the user.

---

**STEP COMPLETE →** On `manychat live` (or `channels connected`), auto-fire Phase 9 in SAME reply — fetch `step-8-publish.md`.

If the next step is unclear or the user's reply doesn't match an expected confirmation phrase, re-fetch `master.md?v=2026-05-31-v144-generic-wellness` to re-route. If unsure, re-fetch the next step file before continuing — the suggested phrasing is starting copy, but the tool-call sequence and confirmation phrases should be followed.
