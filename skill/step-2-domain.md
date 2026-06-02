# Phase 2 — Domain (GoDaddy → Kajabi connect) (v143)

> v143 (2026-05-31) — Restored auto-pilot. Each automated action (CNAME read, DNS record creation, polling, profile save) gets a single sentence of narration before Claude executes — so the user stays informed while the work happens. No permission gates added.
>
> v132 (2026-05-29) — Added domain suggestions sub-step (2.1) before the GoDaddy purchase ask. Pulls first_name + last_name from profile and proposes 3 clean options so the user isn't staring at a blank GoDaddy search bar. last_step granular tracking added.

---

# PHASE 2 — Domain (GoDaddy → Kajabi connect)

**Trigger:** `brand voice done` (or auto after Q10).

**Touchpoint #1 (Kajabi login) — surfaces once, exactly here.**

---

## Step 2.1 — Domain suggestions (NEW)

Pull `first_name` + `last_name` from profile. Propose 3 suggestions in this format:

> Before you go to GoDaddy — three suggestions based on your name. Pick whichever you like (or grab your own if something else feels more "you"):
>
> 1. `{first}{last}.com` — e.g., `dalewaring.com`
> 2. `{first}wellness.com` — e.g., `dalewellness.com`
> 3. `coachwith{first}.com` — e.g., `coachwithdale.com`
>
> Pick one, then go grab it 👇

Save `last_step: "2.1-domain-suggested"`.

---

## Step 2.2 — GoDaddy purchase ask (suggested phrasing)

> Go to **GoDaddy** ([godaddy.com](https://godaddy.com)), search the one you picked (or your own), add it to cart, checkout, skip the upsells — ~$12–15/year. Then **log into Kajabi** ([kajabi.com](https://kajabi.com)) on the same browser. Type **done** when both are done and I'll connect the domain to your Kajabi site. ✻
>
> Walkthrough (optional): [AI-Wellness-GoDaddy-Buy-Domain-v1.pdf](https://ai-wellness-business.netlify.app/pdfs/AI-Wellness-GoDaddy-Buy-Domain-v1.pdf)

Save `last_step: "2.2-godaddy-instructions-sent"`.

---

## Step 2.3 — Wait + connect

- Wait for `done` (variations: `domain bought`, `bought`, `ready`, `kajabi connected`, `logged in`). Save `last_step: "2.3-domain-purchased"`.
- On receipt: narrate ("Pulling your Kajabi CNAME target now."), then `list_connected_browsers` → use index 0.
- Narrate ("Reading the CNAME from your Kajabi admin."), then navigate Kajabi `/admin/site_settings/site_details` → Add Custom Domain → read CNAME target. Save `last_step: "2.4-cname-read"`.
- Narrate ("Adding the CNAME record over in GoDaddy DNS — about 20 seconds."), then switch to the GoDaddy tab (or open `https://account.godaddy.com/products` → DNS) → add the CNAME record pointing to the Kajabi target. Save `last_step: "2.5-cname-added"`.
- Narrate ("Waiting on Kajabi to verify the domain — this can take a couple of minutes."), then switch back to the Kajabi tab and poll for the green checkmark up to 15 min. (Only narrate this wait ONCE — do not repeat per poll.)
- On checkmark: `save_distributor_profile` with `{ distributor_domain: <bare domain of the user>, last_step: "2.6-domain-connected" }`.
- Fire (suggested phrasing, no "ready" prompt):

  > Domain connected. ✓ That's the hardest technical step in the whole kit — done. Now let's lock in your brand kit.

- Auto-fire Phase 3 in the SAME reply — fetch `step-3-kajabi-setup.md?v=2026-05-31-v144-generic-wellness`.

**On success:** advance to Phase 3 (brand kit pick).
**On failure (2x retry):** Send Dispatch message to operator per Rule 3 ("Stuck at domain CNAME with [user name] — [one-line error]"). STOP. Do NOT hand the user a manual CNAME recipe. Do NOT ask them to paste their CNAME target.

---

## HARD RULES — Phase 2

- **Chrome extension is NOT touched here in v143.** It's installed before the chat starts (PDF pre-flight). If `list_connected_browsers` returns 0, that's a Rule 3 Dispatch — NOT a "go install the extension" ask to the user.
- **The user's only touchpoint here is buying the domain + logging into Kajabi.** Everything else — domain suggestions, CNAME read, DNS record creation, polling, profile save — is Claude.
- **Never ask the user for their domain.** It's captured when they buy it.
- **Never ask the user what their CNAME target is.** Claude reads it from Kajabi.
- **Narrate, don't ask.** v143 — one short sentence before each automated action keeps the user informed without pausing for permission. The 15-minute poll is narrated ONCE (not per poll cycle).

---

**STEP COMPLETE →** On Kajabi green checkmark, auto-fire Phase 3 in SAME reply.
