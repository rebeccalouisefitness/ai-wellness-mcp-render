# Step 5 (Customer Side) — Customer Landing + Customer Thank-You (Kajabi MCP) (v143)

> **v143 (2026-05-31)** — Restored auto-pilot. Kajabi MCP stays the primary path. One narration before the customer-pages build block (covers both customer landing + customer thank-you), one outcome message at the end. The pair still chains — no "ready?" gate between them.
>
> **v132 (2026-05-29)** — Kajabi MCP migration. Same flow as the team-member pages (`step-5-recruit-build.md` and `step-5-page-2-thankyou-recruit.md`) but for the customer side: AI Customer form, customer landing page, customer thank-you page. Same Netlify build + Kajabi MCP push pattern. Chrome backup at `step-5-page-2-thankyou-customer.chrome.md.bak.v131-to-v132`.

---

# STEP 5 (Customer Side) — Customer Landing + Customer Thank-You

**Trigger:** the user confirms `yes` to "Ready for Step 6 — customer pages?" at the end of team-member thank-you build (`step-5-page-2-thankyou-recruit.md`).

**Also accepts manual triggers:** `customer pages`, `step 6`, `customer build`.

## RULE 9 — Profile-first probe

Pull saved state via `aiw.get_distributor_profile`. NEVER ask the user for their domain, slug, brand kit, calendly URL, photo links. RULE 9 v123-7 single-match recovery applies.

## Photo prereq

The customer pages use 3 customer-side photos: lifestyle (hero), fit/results, BTS/family. If `distributor_profile.customer_photos_uploaded === true` (from a prior session), skip. Otherwise:

**Verbatim ask (ONE message):**

> Quick step before I build the customer pages — I need 3 photos for the customer side:
>
> 1. **Lifestyle / hero shot** — you in your element, brand-on
> 2. **Fit / results shot** — strength or transformation energy
> 3. **BTS / family shot** — kitchen, family, real life moment
>
> Upload them here: `https://ai-wellness-business.netlify.app/upload-photos?distributor={distributor_slug}&page=customer`
>
> Type **photos uploaded** when done.

Wait for `photos uploaded` (variations: `done`, `uploaded`, `photos done`). Then save `{ customer_photos_uploaded: true }` to profile and continue.

**v143 narration (covers Steps 6.1 + 6.2 together):** narrate ONCE: *"Building both your customer pages now — landing + thank-you, about 3 minutes."* Then run 6.1 → 6.2 back-to-back without per-step announcement; finish with the closing message in STEP COMPLETE.

## Step 6.1 — Build customer landing page

**A — Create the customer form via Kajabi MCP:**

```
form = kajabi.create_form(
  site_id: <from profile>,
  name: "AI Customer",
  fields: [
    { type: "text",  name: "first_name", required: true,  label: "First name" },
    { type: "email", name: "email",      required: true,  label: "Email" }
  ]
)
```

Capture `form.id` (`{{KAJABI_CUSTOMER_FORM_ID}}`) and `form.embed_js_url` (`{{form_embed_js_url}}`). If returns 422 "name taken", call `kajabi.list_forms` and pull the existing form's id + embed URL.

**B — Build customer landing HTML:**

```
result = aiw.substitute_and_publish(
  template_name: "customer",
  brand_kit_id: <profile>,
  distributor_data: { ...profile },
  page_slug: "/ai-wellness-customer",
  distributor_slug: <profile>,
  form_id: form.id,
  form_embed_js_url: form.embed_js_url,
)
```

Returns `{ url, page_title: "AI Wellness Customer", ... }`. Capture `url` and `page_title`.

**C — Fetch HTML from Netlify:** `curl <url>`.

**D — Push to Kajabi:**

```
page = kajabi.create_landing_page(
  site_id: <profile>,
  title: "AI Wellness Customer",
  path: "/ai-wellness-customer",
  custom_code: <HTML>,
  status: "published"
)
```

If 422 "slug exists": `kajabi.update_landing_page(<existing id>, custom_code, status: "published")`. Capture `page.id` as customer landing page id.

**E — Verify:** `curl -sI https://{distributor_domain}/ai-wellness-customer` → HTTP 200.

**F — Surface live URL + auto-fire customer thank-you build in SAME execution (no user confirmation needed — chained, per v132 customer-side recipe):**

Internal log only: `customer_landing_live`. Don't message the user yet — chain into the customer thank-you build immediately.

## Step 6.2 — Build customer thank-you page

**A — Build the thank-you HTML:**

```
result = aiw.substitute_and_publish(
  template_name: "thank-you-customer",
  brand_kit_id: <profile>,
  distributor_data: { ...profile },
  page_slug: "/ai-wellness-customer-thank-you",
  distributor_slug: <profile>,
  // video_url OMITTED — customer thank-you can re-use the team-member video later, OR ship without a video
)
```

Returns `{ url, page_title: "AI Wellness Customer Thank You", ... }`.

**B — Fetch HTML:** `curl <url>`.

**C — Push to Kajabi:**

```
page = kajabi.create_landing_page(
  site_id: <profile>,
  title: "AI Wellness Customer Thank You",
  path: "/ai-wellness-customer-thank-you",
  custom_code: <HTML>,
  status: "published"
)
```

If 422: update existing. Capture id.

**D — Verify:** `curl -sI https://{distributor_domain}/ai-wellness-customer-thank-you` → HTTP 200.

## STEP COMPLETE — Surface both pages live, auto-fire Phase 7 (Emails)

**Verbatim closing (ONE message):**

> Customer funnel live ✓
> - Landing: `https://www.{distributor_domain}/ai-wellness-customer`
> - Thank-you: `https://www.{distributor_domain}/ai-wellness-customer-thank-you`
>
> Wiring up your emails + tags + automations next — under 2 minutes, no input needed.

**Then do:**

- `aiw.save_distributor_profile` with `{ customer_pages_live: true, customer_landing_page_id: <id>, customer_thankyou_page_id: <id>, last_step: "6-customer-pages-complete" }`.
- Auto-fire `step-6-manychat.md` (filename retained — content is Emails + Tags + Automations per v120 routing). Same SAME-reply chain.

## HARD RULES — Customer build

- **HARD RULE C1 — AI Customer form before pages.** Just like the team-member side (HARD RULE 5.9-1 — page_title exact), the customer landing template's `{{form_embed_js_block}}` placeholder needs `form_id` + `form_embed_js_url` at build time. Create form first, then build pages.
- **HARD RULE C2 — Customer photos separate from team-member side.** The customer pages use customer-specific photos (lifestyle / fit / BTS), NOT the team-member photos. `distributor_slug` + `page=customer` query param on `/upload-photos` routes photos to the correct manifest.
- **HARD RULE C3 — Customer pages CHAIN.** Build customer landing + customer thank-you in the SAME execution (no "ready for next?" prompt between them). The team-member side waits between pages because the user wants to see each one. The customer side ships as a pair.
- **HARD RULE C4 — Same canonical slugs.** `/ai-wellness-customer` and `/ai-wellness-customer-thank-you`. NEVER inherit operator-name-prefixed slugs. Server-side `substitute_and_publish` enforces.
- **HARD RULE C5 — Same Kajabi MCP session.** No need to re-call `select_site` between customer landing and customer thank-you — the active site persists.

## Notes for the operator

- Chrome flow backup at `step-5-page-2-thankyou-customer.chrome.md.bak.v131-to-v132`. The Chrome flow had a multi-step Customer build that navigated Kajabi admin for each page; the Kajabi MCP version chains both pages in seconds.
- Performance target: <3 min for both customer pages combined.
- After customer pages live, the chained Phase 7 (Emails) runs in `step-6-manychat.md` (also Kajabi MCP) — total time from "customer pages?" yes to "emails live ✓" is <5 min in the new flow vs 30+ min in Chrome.
