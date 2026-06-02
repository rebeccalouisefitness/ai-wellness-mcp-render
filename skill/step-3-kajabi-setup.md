# Step 3 — Kajabi + Brand Kit Pick (v143)

> v143 (2026-05-31) — Restored auto-pilot. After the brand kit is picked, Claude narrates in one sentence ("Locking your kit in your profile and wiring it through your pages — moving to your calendar now.") then auto-advances to Phase 4 in the same reply. No "ready?" prompt.
>
> v123-1 (2026-05-22) — Brand-kits preview URL now rendered as a clickable markdown link per the "no copy/paste" rule.
>
> v123 — step file. Hard rules inherited from master.md (router). This file holds the suggested phrasing + tool-call sequence for Phase 3 of the 11-phase flow. The user picks 1 of 10 brand kits → Claude responds "Excellent choice." → auto-advance to Calendly. No "ready?" prompt.

---

# PHASE 3 — Brand kit pick

**Trigger:** `domain connected` (auto, from Step 2 success).

**Decision moment (not a touchpoint) — the user picks 1 of 10.**

**Suggested phrasing:**

> Pick your **Brand Kit** ✻ — the vibe of your website, emails, and graphics, top to bottom. Here are the 10 options:
>
> **1. The Athlete** · Nike-energy, bold + clean
> **2. The Mindful** · Lululemon-warmth, soft + grounded
> **3. The Luxury** · LV-elegance, deep + considered
> **4. The Tech** · Whoop-precision, sharp + minimal
> **5. The Editor** · Vogue/Goop-curated, editorial calm
> **6. The Coastal** · Aviator-light, airy + natural
> **7. The Earth Mother** · Sakara-warmth, earthy + nourishing
> **8. The Boss** · Ivy Park/Spanx, confident + sharp
> **9. The Joyful** · Glossier-bright, playful + alive
> **10. The Modernist** · Apple/Aesop, restrained + intentional
>
> [Browse the visual previews here](https://ai-wellness-business.netlify.app/brand-kits)
>
> Type the kit name (e.g. **the tech**, **coastal**, **earth mother**) ✨

**Then do:**

- Wait for one of the 10 canonical kit names (mapping table below).
- Map to `brand_kit_id` via the table.
- Narrate in one sentence ("Locking your kit in your profile now.") then call `save_distributor_profile` with `{ brand_kit_id: <id>, last_step: "3-kajabi-setup" }`.
- Fire (suggested phrasing, ONE response, then auto-fire Phase 4 in SAME reply):

  > Excellent choice. Your kit is **[Kit Name]** — that's locked in across every page, email, and graphic we build from here. Moving to your calendar setup next.

- Auto-fire `step-4-calendly.md?v=2026-05-31-v144-generic-wellness` immediately. No "ready?" prompt.

**On success:** advance to Phase 4 (Calendly).
**On failure (2x retry):** Send Dispatch message to operator per Rule 3. STOP.

---

## Canonical kit mapping (v120 — unchanged in v123)

| User says | Canonical | Kit ID |
|---|---|---|
| athlete / nike | The Athlete | `the-athlete` |
| mindful / lululemon | The Mindful | `the-mindful` |
| luxury / lv / louis vuitton | The Luxury | `the-luxury` |
| tech / whoop | The Tech | `the-tech` |
| editor / vogue / goop | The Editor | `the-editor` |
| coastal / aviator | The Coastal | `the-coastal` |
| earth mother / sakara | The Earth Mother | `the-earth-mother` |
| boss / ivy park / spanx | The Boss | `the-boss` |
| joyful / glossier | The Joyful | `the-joyful` |
| modernist / apple / aesop | The Modernist | `the-modernist` |

Fetch the kit object from `https://ai-wellness-business.netlify.app/brand-kits.json?v=2026-05-31-v144-generic-wellness` and capture `primary` + `accent` + `typography` for downstream use. `brand-kits.json` is LOCKED — do not modify.

---

## HARD RULES — Phase 3

- **One question, one answer.** Do NOT follow up with palette variants ("do you prefer the warm or cool version?"). The 10 kits are the 10 kits — no sub-pickers.
- **"Excellent choice." is the EXACT acknowledgement.** Not "great choice" / "love it" / "perfect" / "beautiful". One canonical phrase keeps the brand voice consistent across wellness business owners.
- **Auto-advance to Phase 4 in the SAME reply.** Do not pause for `next` / `ok` / `ready`. The acknowledgement and the Calendly script fire in one breath.
- **NEVER re-ask for the brand kit.** Per master.md RULE 9, downstream steps probe `get_distributor_profile` or the live page CSS `--primary` variable.
- **Kajabi signup is NOT here in v123.** v120's Step 3 had a Kajabi-signup ask ("sign up at kajabi.com → free trial → cheapest tier"). In v123 that's assumed done in the PDF pre-flight — by the time the user types `done` in Phase 2, they're logged into Kajabi. If a Kajabi `/admin` page returns 401/login, that's a Rule 3 Dispatch, not a user-facing re-prompt.

---

**STEP COMPLETE →** On a kit name (e.g. `the tech`, `coastal`, `earth mother`), auto-fire Phase 4 in SAME reply — fetch `step-4-calendly.md`.

If the next step is unclear or the user's reply doesn't match an expected confirmation phrase, re-fetch `master.md?v=2026-05-31-v144-generic-wellness` to re-route. If unsure, re-fetch the next step file before continuing — the suggested phrasing is starting copy, but the tool-call sequence and confirmation phrases should be followed.
