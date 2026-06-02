# Step 5 (Page 2 of 2) — Team-Member Thank-You + Video Injection (Kajabi MCP) (v143)

> **v143 (2026-05-31)** — Restored auto-pilot. Kajabi MCP stays the primary path for thank-you page build + video swap. One sentence of narration before the build block, one before the video-swap block — keeps the user in the loop without pausing for permission.
>
> **v132 (2026-05-29)** — Kajabi MCP migration. Same Netlify build for the thank-you template, same video upload via `/upload-video`, same `add_video_to_published_page` swap logic — but the "navigate to Kajabi page editor → Ace setValue → Save" Chrome step is replaced with `kajabi.update_landing_page`. Chrome backup at `step-5-page-2-thankyou-recruit.chrome.md.bak.v131-to-v132`.

---

# STEP 5 (Page 2 of 2) — Team-Member Thank-You Page

**Trigger:** the user confirms `next page` after team-member landing went live (Block D in `step-5-recruit-build.md`).

## RULE 9 — Profile-first probe (preserved)

Before doing anything, call `aiw.get_distributor_profile(first_name)` or `aiw.get_distributor_profile(distributor_name)` to pull all saved state. NEVER ask the user for their domain, slug, brand kit, calendly URL, photo links, or video URL — those are already saved. RULE 9 v123-7 single-match recovery applies.

## Build sequence

**v143 narration:** before STEP A, narrate ONCE: *"Building your thank-you page now — about 90 seconds."* Then run A → B → C → D without per-call announcement; finish with the live-URL message (Step E).

**A — Build the thank-you page HTML:**

```
result = aiw.substitute_and_publish(
  template_name: "thank-you-recruit",
  brand_kit_id: <from profile>,
  distributor_data: { ...from profile },
  page_slug: "/ai-wellness-business-thank-you",
  distributor_slug: <from profile>,
  // video_url OMITTED on purpose — initial publish ships with placeholder
)
```

Returns `{ url, page_title, video_placeholder_pending: true, ... }`. Capture `url` and `page_title`.

**B — Fetch the HTML from Netlify:** `curl <url>` to get the final HTML (photos baked, video placeholder visible).

**C — Push to Kajabi via MCP:**

```
page = kajabi.create_landing_page(
  site_id: <from profile>,
  title: "AI Wellness Business Thank You",      // exact page_title from step A
  path: "/ai-wellness-business-thank-you",
  custom_code: <HTML from step B>,
  status: "published"
)
```

If returns 422 "slug exists": `kajabi.update_landing_page(<existing id>, custom_code, status: "published")`. Capture the page `id`.

**D — Verify live:** `curl -sI https://{distributor_domain}/ai-wellness-business-thank-you` → HTTP 200. Confirm a distinctive substring of the HTML appears in the response body.

**E — Surface live URL + video upload link (suggested phrasing, ONE message):**

> Thank-you page live ✓ → `https://www.{distributor_domain}/ai-wellness-business-thank-you`
>
> One last thing — your **2-minute explainer video**. Upload it here: `https://ai-wellness-business.netlify.app/upload-video?distributor={distributor_slug}` 
>
> The page is live with a placeholder for now. As soon as you upload, I'll swap your video in automatically. Type **video done** when uploaded.

**Then wait for `video done` (variations: `done`, `recorded`, `uploaded the video`, `uploaded`).**

## Step 5.10 — Video injection (Kajabi MCP)

When the user says `video done`, narrate ONCE: *"Pulling your video and swapping it into the live page now — about 20 seconds."* Then run steps 1 → 7 without per-call narration; finish with the closing message in STEP COMPLETE.

**1 — Pull the uploaded video URL:**

```
v = aiw.get_latest_video_upload(distributor_slug: <from profile>)
```

Returns `{ found: true, video_url, ... }`. If `found: false`, ask the user to retry the upload and wait for `video done` again. NEVER ask them to paste the URL — chat doesn't handle video bytes.

**2 — Validate the URL:** must be on `ai-wellness-business.netlify.app/distributor-videos/...` or `/distributor-media/...`. Reject YouTube, Vimeo, Wistia, Kajabi Media (HARD RULE — `aiw.add_video_to_published_page` enforces this server-side too).

**3 — Get the current page HTML from Kajabi:**

```
current = kajabi.get_landing_page(site_id: <profile>, landing_page_id: <id from step C above>)
```

Capture `current.custom_code`.

**4 — Swap the placeholder:** replace `<video data-video-pending="true">` with `<video src="{video_url}" controls playsinline data-video-source="ai-wellness-netlify">` in the HTML string. Also handle the legacy `src="REPLACE_ME_VIDEO"` form for back-compat with older builds (regex: `src="REPLACE_ME_VIDEO"` → `src="{video_url}"`).

**5 — Push updated HTML back to Kajabi:**

```
kajabi.update_landing_page(
  site_id: <profile>,
  landing_page_id: <id>,
  custom_code: <updated HTML>,
  status: "published"      // keep published
)
```

**6 — Verify:** `curl https://{distributor_domain}/ai-wellness-business-thank-you` → confirm the new `video_url` appears in the response body. If it doesn't (cache delay), wait 10s and re-verify once.

**7 — Internal log:** `step_5_10_video_injected` with `{ page_id, video_url, ms_to_swap }`.

## STEP COMPLETE

After Step 5.10 succeeds (video URL appears in live page):

**Verbatim closing (ONE message):**

> Video embedded + live ✓ Your team-member funnel is up: landing + thank-you with your video, photos, and form all wired. 
>
> Ready for Step 6 — customer pages? Same flow, different audience.

**Then do:**

- `aiw.save_distributor_profile` with `{ recruit_pages_live: true, recruit_thankyou_page_id: <id>, last_step: "5-recruit-thankyou-complete" }`.
- Wait for `yes` (variations: `next`, `go`, `customer pages`, `let's do it`).
- On receipt → load `step-5-page-2-thankyou-customer.md` and execute.

## HARD RULES — Step 5.10

- **HARD RULE 5.10-1 — Video host is Netlify CDN only.** Reject YouTube, Vimeo, Wistia, Kajabi Media (v72 host rule). `aiw.add_video_to_published_page` enforces server-side, but client-side validation here is defence-in-depth.
- **HARD RULE 5.10-2 — Chat NEVER handles video bytes.** The user uploads to `/upload-video` → AIW server captures URL → Kajabi MCP swaps the placeholder via API. No base64 in chat, no clipboard paste of video data.
- **HARD RULE 5.10-3 — Page stays published.** The `kajabi.update_landing_page` call must keep `status: "published"`. Never let an updated page silently revert to draft.
- **HARD RULE 5.10-4 — Don't recreate the page.** Always UPDATE the existing landing page (by `id` captured during initial create). NEVER call `create_landing_page` again for the thank-you page — that's a duplicate.

## Notes for the operator

- Chrome flow backup at `step-5-page-2-thankyou-recruit.chrome.md.bak.v131-to-v132`. The Chrome flow used `aiw.add_video_to_published_page` to generate a Chrome-extension JS snippet that performed the Ace `setValue` swap. The new flow does the same swap via `kajabi.get_landing_page` + string replace + `kajabi.update_landing_page` — three API calls instead of one Chrome session.
- Performance target: <30 seconds from `video done` to live video on the page.
