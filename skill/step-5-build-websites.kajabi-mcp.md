# Step 5 module — Build all 4 websites (Kajabi MCP path — v132)

> **Source of truth:** `skill/master.md` Step 5 section, this `.kajabi-mcp.md` variant. This module replaces the Chrome-extension flow with direct **Kajabi MCP API calls** for any user who has the Kajabi MCP connector installed.
>
> **Use this variant when:** the user has connected the Kajabi MCP (https://mcp.kajabi.com/mcp) in their Claude. The legacy Chrome-extension flow at `step-5-build-websites.md` is preserved for wellness business owners mid-flow on v123-6 who haven't switched.
>
> **Why this exists:** the Chrome flow was brittle (extension lost windows, Kajabi editors didn't render, sessions expired, ~30+ minutes per build). The Kajabi MCP gives direct API access to landing pages, forms, offers, sequences, broadcasts. Same outcome, **5-10 minutes instead of 30**, no Chrome flakiness.

## Voice rule for the entire step

- One question at a time.
- Conversational — yes / no / done answers, never "type `phrase X`".
- Confirm receipt before moving on ("Got them.", "Great.", "Awesome.").
- Natural English, not robot phrases.

## Prerequisites (verified at Step 5 entry)

Before starting the build, verify the user has BOTH MCPs connected:

1. **AI Wellness MCP** (`https://ai-wellness-business.netlify.app/.netlify/functions/mcp`) — for photos, video, profile, brand kit, styled templates.
2. **Kajabi MCP** (`https://mcp.kajabi.com/mcp`) — for landing pages, forms, offers, sequences, broadcasts.

Sanity-check by calling `kajabi.list_sites` — should return their sites including the one they want to build on. If they see "No sites" or the connector errors, ask them to add the Kajabi MCP in `Settings → Connectors → Add Custom Connector → Name: Kajabi → URL: https://mcp.kajabi.com/mcp → approve in browser`. Don't proceed without it connected.

## Chat sequence — 7 blocks

| Block | Trigger | Claude says (summary) | User responds with |
|---|---|---|---|
| 1 | `kit chosen` from Step 4 | "Awesome — [Kit] locked in. Step 5 of 11. Ready to build your sites?" | yes |
| 2a | yes | "Great. We need 6 photos total. First, send 3 for your CUSTOMER page: lifestyle / fit / BTS." | drops 3 photos OR `photos uploaded` (upload page fallback) |
| 2b | customer photos captured | "Got them. Now send 3 for your TEAM-MEMBER page: power portrait / at work / freedom." | drops 3 photos OR `team-member photos uploaded` |
| 3 | both photo sets captured | "Got both sets. Kajabi connector live? (`list_sites` returns your site?)" | yes |
| 4 | yes | "Building now — should take 5–10 minutes via the Kajabi API. While I work, record your 2-min video. Here's the script + recording guide..." | (records video in background while build runs) |
| — | (build runs — pages 1-4) | mid-progress: `Page 1 of 4 ✓`, `Page 2 of 4 ✓`, `Page 3 of 4 ✓`, `Page 4 of 4 ✓` | — |
| 5 | all 4 pages return 200 | "Done ✻ All 4 pages live: [URLs]. Take your time on the video — no rush. Just say 'video done' when ready." | `video done` |
| 6 | `video done` | "Embedding now…" → "Live ✓ Step 5 complete. Ready for Step 6?" | yes (handoff to Step 6) |

## Variables sourced for the build

Unchanged from the Chrome flow — same brand kit vars, user vars, photo placeholders, form IDs. See `step-5-build-websites.md` for the canonical variable list. The only difference is **how they get into Kajabi**: Kajabi MCP API call instead of Chrome paste.

## Build sequence (Page 1 → Page 4) — Kajabi MCP

All 4 pages built via Kajabi MCP API calls. Single mid-progress line per page (`Page N of 4 ✓`), no extra commentary.

### Setup — once before Page 1

1. `kajabi.list_sites` → confirm the user's site is listed. Take its `id`.
2. `kajabi.select_site(site_id)` → activate it for this session.
3. `kajabi.enable_toolset("pages")` → activates landing-page tools.
4. `kajabi.enable_toolset("forms")` → activates form tools.
5. `aiw.get_styled_template(template_name, brand_kit_id, distributor_data)` → returns the styled HTML for the page, already brand-kitted and substituted.

### Page 1 — Customer (`/wellness`)

1. `aiw.get_styled_template(template_name: "customer", brand_kit_id, distributor_data)` → returns styled HTML.
2. `kajabi.create_form(name: "Customer Signup", fields: [{first_name, required: true}, {email, required: true}])` → returns `form_id` and `form_embed_js_url`. Save these as `{{KAJABI_CUSTOMER_FORM_ID}}` and customer form embed URL.
3. `aiw.substitute_and_publish(template_name: "customer", brand_kit_id, form_id, form_embed_js_url, distributor_data, distributor_slug)` → server bakes form embed into HTML, sets the photos from the manifest, returns the final HTML.
4. `kajabi.create_landing_page(title: "AI Wellness Customer", path: "/wellness", custom_code: <styled HTML>, status: "published")` → page goes LIVE on the user's domain.
5. Verify: HTTP 200 at `https://{{DISTRIBUTOR_DOMAIN}}/wellness`.
6. Emit `Page 1 of 4 ✓`.

### Page 2 — Customer thank-you (`/wellness-thank-you`)

1. `aiw.substitute_and_publish(template_name: "thank-you-customer", brand_kit_id, distributor_data, distributor_slug)` — no form, no video URL → returns final HTML with `<video data-video-pending="true">` placeholder.
2. `kajabi.create_landing_page(title: "AI Wellness Customer Thank You", path: "/wellness-thank-you", custom_code: <styled HTML>, status: "published")`.
3. Verify HTTP 200.
4. Emit `Page 2 of 4 ✓`.

### Page 3 — Team-member (`/ai-wellness-business`)

1. `aiw.get_styled_template(template_name: "recruit", brand_kit_id, distributor_data)` → returns styled HTML.
2. `kajabi.create_form(name: "AI Wellness Application", fields: [{first_name, required: true}, {last_name, required: true}, {email, required: true}, {country, required: false}, {ig_handle, required: false}, {experience_level, required: false}, {ai_comfort, required: false}, {hours_per_week, required: false}, {why, required: false}, {start_date, required: false}])` → returns `form_id` and `form_embed_js_url` for the team-member form. Save as `{{KAJABI_RECRUIT_FORM_ID}}`.
3. `aiw.substitute_and_publish(template_name: "recruit", brand_kit_id, form_id, form_embed_js_url, distributor_data, distributor_slug)` → returns final HTML with form baked, photos baked.
4. `kajabi.create_landing_page(title: "AI Wellness Business", path: "/ai-wellness-business", custom_code: <styled HTML>, status: "published")`.
5. Verify HTTP 200.
6. Emit `Page 3 of 4 ✓`.

### Page 4 — Team-member thank-you (`/ai-wellness-business-thank-you`)

1. `aiw.substitute_and_publish(template_name: "thank-you-recruit", brand_kit_id, distributor_data, distributor_slug)` — no form, no `video_url` → returns HTML with `<video data-video-pending="true">` placeholder.
2. `kajabi.create_landing_page(title: "AI Wellness Business Thank You", path: "/ai-wellness-business-thank-you", custom_code: <styled HTML>, status: "published")`.
3. Verify HTTP 200.
4. Emit `Page 4 of 4 ✓`.

## Video script handoff (Block 4)

Pull `video-scripts/recruit-thank-you-explainer-v2-2min.md` as the canonical structure. Voice: peer-entrepreneur, calm/direct/confident — never BURN-aggressive.

**HARD RULE 5-SCRIPT-1 — Personalize STORY beats, LOCK the solution beat.** The script has two layers that must be handled differently:

**PERSONALIZE these beats using the distributor's saved Phase 1 brand voice (`distributor_brand_voice_story`, `transformation_story`, `business_story`):**
- Hook — open in their voice. Use their `signature_phrase` if it fits. Example shape: "Hey — {first_name} here. If you're watching this, you just showed interest in AI Wellness."
- Problem beat — replace generic "distributors quit inside 18 months" framing with THEIR lived experience drawn from `brand_voice_story` / `transformation_story`. What pain point pushed THEM to look for a system.
- Who-it's-for — qualify in their voice with their target customer mindset (from Phase 1 `target_customer`).
- CTA — sign off in their voice.

**LOCK the SOLUTION beat to the canonical AI Wellness pitch — no rewording, no omitting any element:**
The solution beat MUST contain ALL of: (1) the product name "AI Wellness", (2) "Claude — yes, the AI — set up as your business partner", (3) the 11-step system, (4) what the system builds (brand voice + two websites + email sequences + ManyChat flows + private community), (5) "All wearing your kit, {kit_name}, in your voice. Not mine.", (6) the outcome ("AI does the first 80% of every conversation").
The distributor's personality stays out of this beat — this is the part that explains the product to the prospect. If the solution beat doesn't pitch AI Wellness clearly, the recruit page doesn't convert.

**AUDIENCE — they are PROSPECTS, not current distributors.** The recruit page exists to bring NEW people into the team. They have NOT applied (they showed interest by submitting a form). NEVER write "you just applied" / "as a distributor" / "since you're already running customers". Frame everything for someone considering joining for the first time.

Send the personalized script inline with the build kickoff so the user can record while the build runs.

## Video embed (Block 7) — Kajabi MCP

When the user says `video done` (or close variant: `recorded`, `uploaded the video`, `done`):

1. `aiw.get_latest_video_upload(distributor_slug)` → returns the most recent Netlify-hosted video URL. Validates host (must be on `ai-wellness-business.netlify.app/distributor-videos/...` or `/distributor-media/...`).
2. `aiw.add_video_to_published_page(distributor_domain, page_slug: "/ai-wellness-business-thank-you", video_url)` → returns the verification kit.
3. Instead of running the kit's Chrome-extension snippet, fetch the current page HTML via `kajabi.get_landing_page(landing_page_id)`, swap `<video data-video-pending="true">` for `<video src="{{video_url}}" controls playsinline>`, then `kajabi.update_landing_page(landing_page_id, custom_code: <updated HTML>)`.
4. Verify HTTP 200 + the video URL appears in the live page source.
5. Send: `Embedded + live. Step 5 complete ✓ Ready for Step 6 — your email sequences?`

## Hard rules (unchanged from Chrome flow + new MCP-specific)

- **Conversational. One question at a time.** No walls of instructions, no "type `phrase X`".
- **Chat-first photo upload, /upload-photos fallback** (not the other way around).
- **2 separate photo asks** (customer set, then team-member set). Tag correctly via `{{CUSTOMER_PHOTO_*}}` vs `{{RECRUIT_PHOTO_*}}`.
- **Team-member hero = power portrait.** Customer hero = lifestyle. Don't swap.
- **Video script + build run in parallel** — start the build the moment the user confirms both MCPs are connected.
- **The user's own Claude executes the build.** The operator's side does NOT build.
- **Both MCPs required.** AI Wellness + Kajabi. No Chrome extension in this variant.
- **Same kit on every page.**
- **Team-member "first of its kind" banner** non-removable. Hardcoded in template.
- **Zero Rebecca references** on the team-member page.
- **Canonical slugs only.** `/wellness`, `/wellness-thank-you`, `/ai-wellness-business`, `/ai-wellness-business-thank-you`. Never inherit operator-name-prefixed slugs.
- **Forms before pages.** Team-member + customer pages need their form IDs before the HTML build call so the `{{form_embed_js_block}}` placeholders resolve.
- **One Kajabi session per build.** Call `select_site` ONCE, then build all 4 pages without re-selecting.

## Errors + recovery

| Error | Cause | Fix |
|---|---|---|
| `kajabi.list_sites` returns `[]` | MCP not authenticated to the user's Kajabi account | The user visits `https://mcp.kajabi.com/mcp` from the browser they used to add the connector — re-approves OAuth. |
| `kajabi.create_landing_page` returns 422 with "slug exists" | Page already created (chat retried). | Call `kajabi.list_landing_pages` to find existing page, then `kajabi.update_landing_page` instead. Don't duplicate. |
| `aiw.substitute_and_publish` returns `unsubstituted_photo_markers` | Photos haven't uploaded yet. | Surface the upload URL from the error to the user and wait for them to confirm "photos uploaded" again. |
| Page HTTP 200 but missing form embed | Form created AFTER substitute_and_publish was called | Recreate the page with the form_id this time. Forms before pages. |
| `kajabi.create_form` returns 422 with "name taken" | Form created in a prior build attempt | Call `kajabi.list_forms`, find existing form, capture its `id` and `embed_js_url`, reuse. |

## Notes for the operator

- The Chrome-extension version of Step 5 is preserved at `step-5-build-websites.md`. Use that variant for Dale (mid-flow at v123-6) or any user who has not added the Kajabi MCP.
- This variant assumes the user's chat-side Claude has both MCPs connected. The operator's Claude (chat-Claude) does NOT execute the build — only the user's Claude does, since the Kajabi MCP auth is per-account.
- Performance target: 5-10 minutes total for all 4 pages including video embed. If a build takes >15 minutes, something's wrong with the MCP transport (check `kajabi.ping` and `aiw.get_distributor_profile` both return fast).
- For the v124 XSS guarantee, user-supplied strings (`first_name`, `story_paragraph_*`, etc.) are still sanitized at the AIW server inside `get_styled_template` / `substitute_and_publish`. Nothing changes in the security model — the Kajabi MCP just replaces the "paste into Custom Code" step.

## Phase mapping

This step is **Phase 5 (Team-member pages — build)** in the 11-phase router. Phase 6 (Customer pages) uses the same flow but with different templates + different forms. Phase 9 (Launch / publish) wraps with `update_offer` to wire payment.
