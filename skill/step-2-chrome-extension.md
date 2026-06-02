# Step 2 — Deprecated (Chrome extension dropped from routing) (v123)

> v123 — the Chrome-extension install step has been DROPPED from the 11-phase routing. The extension is assumed installed during the PDF pre-flight before the user enters the chat. Re-fetch `master.md?v=2026-05-22-v123-1` and use `step-2-domain.md` (Phase 2 — Domain → Kajabi connect).

**Action:** re-fetch `https://ai-wellness-business.netlify.app/skill/master.md?v=2026-05-22-v123-1`, then re-route to `step-2-domain.md` for Phase 2.

If `list_connected_browsers` returns 0 results at any point downstream, that is a Rule 3 Dispatch to operator — NOT a "go install the extension" ask to the user. The extension is part of the pre-flight, not the chat.

Do NOT run this file's old script — fetch the new one.
