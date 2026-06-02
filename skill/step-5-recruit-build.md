# Step 5 — Team-Member Page Build (Page 1 of 2 + Form + Kajabi MCP Publish)

> Kajabi MCP is the primary path here. Each automated action (build HTML, fetch from Netlify, push to Kajabi, verify live URL) gets a single sentence of narration before Claude executes — user stays informed while the build happens. No "ready?" gates inside the build.
>
> The template carries a visible disclosure block. The user's first name + portrait stay visible across the page. Suggested phrasing is starting copy; adapt for tone while keeping the structure and tool-call order intact.
>
> Hard rules are inherited from master.md (router). This file holds the suggested copy + tool-call sequence for this step. Use the phrasing as a starting point; adapt naturally to keep the conversation human. The TOOL-CALL order and the canonical slugs/page_titles are NOT negotiable — those keep the build correct.

---

# STEP 5 — Build 2 team-member pages (Kajabi MCP driven)

**DEFAULT BUILD:** team-member landing + team-member thank-you ONLY (slug `ai-wellness-business` — this is the team page that introduces the user's wellness business). Customer pages opt-in via Block C.2 AFTER team pages are live + 1-2 weeks. The team-member page template ships with a visible disclosure block.

**PREREQUISITE:** the user has both the AI Wellness MCP AND the Kajabi MCP connected in their Claude. Verify with `kajabi.list_sites` returning their site at the top of Step 5 entry. If `kajabi.list_sites` errors or returns empty: surface the install URL `https://mcp.kajabi.com/mcp` and wait for `connected` before proceeding.

## Step 5.9 — Canonical Publish-to-Kajabi (Kajabi MCP)

The Netlify URL from `substitute_and_publish` is INTERMEDIATE. A successful Step 5 ends with the page **LIVE AND PUBLISHED** on the user's domain (`https://www.{distributor_domain}{canonical_slug}` → HTTP 200, page status `published` in Kajabi). v132: the publish is a single API call — `kajabi.create_landing_page(..., status: "published")`.

### Push Netlify HTML into Kajabi via API

**v143 narration pattern:** before STEP A, narrate ONCE: *"Building your team-member page now — about 2 minutes."* Then run A → B → C → D → E without per-call narration. After step D verifies HTTP 200, surface the live URL (the Block D message below). One narration at the start, one outcome message at the end — that's it for this block.

PROCEDURE:

1. **A — Build:** Call `aiw.substitute_and_publish` with `brand_kit_id`, `template_name`, `distributor_data`, canonical `page_slug`, `form_id`+`form_embed_js_url` (team-member + customer), `distributor_slug` (for photo auto-fetch). Returns `{ url (INTERMEDIATE Netlify URL), page_title, auto_publish_contract, ... }`. Capture `page_title` AND `url`.

2. **B — Fetch HTML from Netlify:** `curl` the returned `url` to get the final HTML. (The Netlify build is the source of truth — the HTML has photos baked in, brand kit applied, form embed wired.) Use `mcp__Macos__Shell curl` for reliability; falling back to `mcp__workspace__bash` only if Mac shell isn't available.

3. **C — Create the Landing Page via Kajabi MCP (PRIMARY PATH):**

   ```
   page = kajabi.create_landing_page(
     site_id: <distributor_site_id>,
     title: <page_title from step A>,           // EXACT verbatim, no suffix
     path: <canonical_slug>,                    // /ai-wellness-business, etc.
     custom_code: <HTML from step B>,
     status: "published"                        // publish in one shot
   )
   ```

   Returns `{ id, url, status }`. Capture `id` for the video-injection step.

4. **D — Verify live:** `curl -sI https://{distributor_domain}{canonical_slug}` → must return HTTP 200.

5. **E — Internal log:** record `step_5_9_page_created` with `{ page_id, page_title, canonical_slug, status: "published", live_url }`.

### HARD RULES — Step 5.9 anti-thrash guardrails

**HARD RULE 5.9-1 — Page title is EXACT.** `kajabi.create_landing_page` must use the `page_title` returned by `substitute_and_publish` verbatim. Canonical values (do not invent variants): `AI Wellness Business` (template_name: recruit), `AI Wellness Customer` (template_name: customer), `AI Wellness Business Thank You` (template_name: thank-you-recruit), `AI Wellness Customer Thank You` (template_name: thank-you-customer). The skill ALWAYS reads these from the `substitute_and_publish` response — never hardcoded in the publish step.

**HARD RULE 5.9-2 — Canonical slug is locked.** `kajabi.create_landing_page` `path` MUST be one of: `/ai-wellness-business`, `/ai-wellness-business-thank-you`, `/ai-wellness-customer`, `/ai-wellness-customer-thank-you`. NEVER inherit a user-name-prefixed slug. NEVER ask the user what slug they want. Server-side validation in `substitute_and_publish` refuses non-canonical slugs.

**HARD RULE 5.9-3 — If page already exists, UPDATE instead of CREATE.** If `kajabi.create_landing_page` returns 422 "slug already exists" (chat retried), call `kajabi.list_landing_pages` filtered by path, capture the existing `id`, then `kajabi.update_landing_page(id, custom_code: <HTML>, status: "published")`. Never duplicate.

**HARD RULE 5.9-4 — Landing Pages only.** `kajabi.create_landing_page` writes to Landing Pages (Website → Landing Pages). The Kajabi MCP only exposes landing pages — there is no risk of accidentally writing to Website Pages. (Carried forward from v109 HARD RULE 5.9-6.)

**HARD RULE 5.9-PATH — Kajabi MCP is the primary path.** All Kajabi writes in v143 go through the Kajabi MCP (`mcp__72aa0297-c472-419d-bd36-ab7287571f25__*` — `create_landing_page`, `update_landing_page`, `create_form`, `create_sequence`, `add_sequence_email`, `create_tag`, `list_*`). Chrome ext is reserved for tools without an API — Calendly + ManyChat — and the emergency Chrome-flow backup at `.chrome.md.bak.v131-to-v132`. Do NOT mix the two paths in a single session.

**HARD RULE 5.9-5 — Auto-publish in one call.** `status: "published"` is set on `create_landing_page` directly. No separate publish step. No "Save then click Publish" sequence. No browsing Kajabi admin to flip status. If for any reason the page lands as `draft`, immediately call `kajabi.update_landing_page(id, status: "published")` and re-verify HTTP 200 on the user's domain.

**HARD RULE 5.9-6 — Photos baked at build time.** `substitute_and_publish` auto-fetches photos from the `/upload-photos` manifest using `distributor_slug`. Photos arrive in the HTML BEFORE Kajabi receives the page. NEVER round-trip photos through chat. NEVER paste base64 into the LLM context.

**HARD RULE 5.9-7 — Video is post-publish.** Team-member thank-you page publishes with a `<video data-video-pending="true">` placeholder. Video injection happens in `step-5-page-2-thankyou-recruit.md` via `kajabi.update_landing_page` after `aiw.add_video_to_published_page` returns the embed swap data.

**HARD RULE 5.9-8 — One MCP session per build.** Call `kajabi.select_site(site_id)` ONCE before Step 5.9 starts. Don't reselect between pages — the Kajabi MCP session keeps the active site for subsequent calls.

---

## STEP COMPLETE — Block D + Block C.2

After Step 5.9 succeeds for the team-member landing page (HTTP 200 verified on the user's domain):

**Block D — surface live URL to the user (suggested phrasing, ONE message):**

> Team-member page live ✓ → `https://www.{distributor_domain}/ai-wellness-business`
>
> Take a look. When you're ready, type **next page** and I'll build the thank-you page.

**Then do:**

- Wait for `next page` (variations: `go`, `next`, `done`, `looks good`, `ready for next`).
- On receipt → load `step-5-page-2-thankyou-recruit.md` and follow its suggested phrasing + tool-call sequence.
- On `not yet` / `wait` / `looks wrong`: dispatch to operator with the feedback verbatim. Don't try to fix UI issues in chat — the page is live, the user can iterate via the Kajabi admin if needed.

**Block C.2 — Customer build opt-in (later — NOT triggered here):** offered to the user 1-2 weeks AFTER team-member pages are live, via a separate operator-initiated check-in. NEVER auto-fire customer build immediately after team-member pages.

---

## Notes for the operator

- The Chrome-extension version of Step 5 is preserved at `step-5-recruit-build.chrome.md.bak.v131-to-v132` for emergency rollback. If Kajabi MCP has a regression that breaks the build, restore the Chrome flow with `cp step-5-recruit-build.chrome.md.bak.v131-to-v132 step-5-recruit-build.md` and redeploy.
- The new flow assumes the user's chat-side Claude has both MCPs connected. AIW MCP for the build + Kajabi MCP for the push.
- For the v124 XSS guarantee, user-supplied strings (`first_name`, `story_paragraph_*`, etc.) are still sanitized at the AIW server inside `substitute_and_publish`. Nothing changes in the security model.
- Performance target: <2 min per page (substitute_and_publish + curl + create_landing_page + curl verify). If a page takes >5 min, something's wrong with one of the MCPs.
