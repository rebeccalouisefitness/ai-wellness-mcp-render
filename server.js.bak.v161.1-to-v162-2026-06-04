// AI Wellness MCP — Render-hosted thin protocol wrapper.
//
// Uses the official @modelcontextprotocol/sdk to handle the Streamable HTTP
// transport, so claude.ai's connector framework sees a spec-perfect MCP server.
// All data operations delegate to the existing Netlify deployment via HTTP, so
// we keep distributor profiles, photos, videos, and styled pages where they
// already live (no data migration needed).

import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { randomUUID } from "node:crypto";
import { z } from "zod";

const NETLIFY_BASE = process.env.NETLIFY_BASE || "https://ai-wellness-business.netlify.app";
const PORT = process.env.PORT || 3000;

// ──────────────────────────────────────────────────────────────────────────
// MCP server definition
// ──────────────────────────────────────────────────────────────────────────

function buildMcp() {
  const server = new McpServer(
    {
      name: "ai-wellness-playbook",
      version: "1.0.0",
    },
    {
      capabilities: { tools: { listChanged: false } },
    }
  );

  // ── get_step_by_phase ────────────────────────────────────────────────
  server.tool(
    "get_step_by_phase",
    "Fetch the step file for a given phase number (1-9, plus 7.5). Returns the markdown content used to drive that phase of the conversation.",
    {
      phase: z.string().describe("Phase number: 1 (welcome+brand voice), 2 (domain), 3 (Kajabi+brand kit), 4 (Calendly), 5 (team pages), 6 (customer pages), 7 (emails), 7.5 (pre-ManyChat funnel test), 8 (ManyChat), 9 (launch)."),
    },
    async ({ phase }) => {
      const PHASE_FILES = {
        1: "step-1-welcome-brand-voice.md",
        2: "step-2-domain.md",
        3: "step-3-kajabi-setup.md",
        4: "step-4-calendly.md",
        5: "step-5-recruit-build.md",
        6: "step-5-page-2-thankyou-customer.md",
        7: "step-6-manychat.md",
        "7.5": "step-7.5-funnel-test.md",
        8: "step-7-emails.md",
        9: "step-8-publish.md",
      };
      const file = PHASE_FILES[String(phase)];
      if (!file) {
        return {
          content: [{ type: "text", text: `Unknown phase: ${phase}. Valid phases are 1-9 (plus 7.5).` }],
          isError: true,
        };
      }
      const url = `${NETLIFY_BASE}/skill/${file}`;
      try {
        const r = await fetch(url);
        if (!r.ok) throw new Error(`HTTP ${r.status} from ${url}`);
        const text = await r.text();
        return {
          content: [{ type: "text", text }],
        };
      } catch (e) {
        return {
          content: [{ type: "text", text: `Failed to fetch ${file}: ${e.message}` }],
          isError: true,
        };
      }
    }
  );

  // ── get_playbook ────────────────────────────────────────────────────
  server.tool(
    "get_playbook",
    "Fetch the master playbook (master.md) that describes the overall flow and routing.",
    {},
    async () => {
      const url = `${NETLIFY_BASE}/skill/master.md`;
      try {
        const r = await fetch(url);
        if (!r.ok) throw new Error(`HTTP ${r.status} from ${url}`);
        const text = await r.text();
        return { content: [{ type: "text", text }] };
      } catch (e) {
        return {
          content: [{ type: "text", text: `Failed to fetch master.md: ${e.message}` }],
          isError: true,
        };
      }
    }
  );

  // ── save_distributor_profile ─────────────────────────────────────────
  // v160 (2026-06-04): added distributor_slug + 16 dashboard fields.
  // Downstream Netlify save handler already accepts these (and via the
  // forward-compat loop at lines 117-122 of save-distributor-profile.mjs
  // preserves any extra field). The Render MCP just needed to stop
  // dropping them in Zod validation. Field names match exactly what
  // ai-wellness-distributor-dashboard/netlify/functions/list-distributors.mjs reads.
  server.tool(
    "save_distributor_profile",
    "Save or update the user's profile (brand voice answers, name, country, slug, domain, brand kit, calendly, form ids, page URLs, photo/manychat/launch flags, etc). All fields optional — partial saves are merged into the existing record. Profiles persist across sessions.",
    {
      first_name: z.string().optional().describe("First name"),
      last_name: z.string().optional().describe("Last name"),
      country: z.string().optional().describe("Country"),
      pronouns: z.string().optional().describe("Pronouns (he, she, they, etc.)"),
      distributor_name: z.string().optional().describe("Unique distributor identifier. Pass on subsequent saves to merge updates into the same record."),
      brand_voice_doc: z.string().optional().describe("Full brand voice document text"),
      brand_voice_story: z.string().optional().describe("Synthesized story"),
      transformation_story: z.string().optional().describe("Q1 — transformation story"),
      business_story: z.string().optional().describe("Q2 — business story"),
      last_step: z.string().optional().describe("Tracking value for current step"),
      // v160 — dashboard string fields
      distributor_slug: z.string().regex(/^[a-z0-9][a-z0-9_\-]{0,63}$/).optional().describe("Canonical slug for blob keys + page URLs. Lowercase alphanumeric + hyphens/underscores, 1-64 chars. Must start with letter or digit. Save the FIRST slug used for this distributor and reuse forever — never re-derive."),
      distributor_domain: z.string().optional().describe("Distributor's Kajabi domain — e.g. 'yourpowermama.com' or 'xxx.mykajabi.com'."),
      brand_kit: z.string().optional().describe("Selected brand kit name/id."),
      palette_variant: z.string().optional().describe("Selected palette variant within the brand kit."),
      calendly_url: z.string().optional().describe("Primary Calendly URL."),
      calendly_recruit_url: z.string().optional().describe("Calendly URL for recruit/team-member calls."),
      calendly_customer_url: z.string().optional().describe("Calendly URL for customer/coaching calls."),
      form_id: z.string().optional().describe("Default Kajabi form id (recruit by convention)."),
      recruit_form_id: z.string().optional().describe("Kajabi form id for the recruit page."),
      customer_form_id: z.string().optional().describe("Kajabi form id for the customer page."),
      recruit_url: z.string().optional().describe("Published recruit landing-page URL on the distributor's domain."),
      recruit_thankyou_url: z.string().optional().describe("Published recruit thank-you page URL."),
      customer_url: z.string().optional().describe("Published customer landing-page URL."),
      customer_thankyou_url: z.string().optional().describe("Published customer thank-you page URL."),
      video_recruit_url: z.string().optional().describe("Distributor's recruit/team-member video URL."),
      current_phase: z.string().optional().describe("Human-readable current phase (mirror of last_step, kept for dashboard clarity)."),
      // v160 — dashboard boolean flags
      photos_recruit_uploaded: z.boolean().optional().describe("True once recruit-page photos are in the photos blob store."),
      recruit_photos_uploaded: z.boolean().optional().describe("Alias for photos_recruit_uploaded."),
      photo_customer_uploaded: z.boolean().optional().describe("True once customer-page photos are uploaded."),
      customer_photos_uploaded: z.boolean().optional().describe("Alias for photo_customer_uploaded."),
      photos_customer_uploaded: z.boolean().optional().describe("Alias for photo_customer_uploaded."),
      manychat_installed: z.boolean().optional().describe("True once distributor has imported the ManyChat template."),
      manychat_complete: z.boolean().optional().describe("Alias for manychat_installed."),
      launching_confirmed: z.boolean().optional().describe("True when the distributor confirms they've launched (final phase complete)."),
      // v161 — pre-ManyChat funnel test gate (Phase 7.5)
      funnel_test_passed: z.boolean().optional().describe("True when the Phase 7.5 end-to-end funnel test passed for BOTH recruit + customer funnels (contact created, tag applied, welcome sequence enrolled, Calendly link matches profile). Idempotent gate — Phase 7.5 skips if true."),
      recruit_lead_tag: z.string().optional().describe("Override for the expected recruit-funnel tag name (defaults to 'AI Wellness Recruit Lead' in step-7.5)."),
      customer_lead_tag: z.string().optional().describe("Override for the expected customer-funnel tag name (defaults to 'AI Wellness Customer Lead' in step-7.5)."),
    },
    async (args) => {
      const url = `${NETLIFY_BASE}/api/save-distributor-profile`;
      try {
        const r = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(args),
        });
        const text = await r.text();
        if (!r.ok) throw new Error(`HTTP ${r.status}: ${text}`);
        return { content: [{ type: "text", text }] };
      } catch (e) {
        return {
          content: [{ type: "text", text: `Save failed: ${e.message}` }],
          isError: true,
        };
      }
    }
  );

  // ── get_distributor_profile ──────────────────────────────────────────
  server.tool(
    "get_distributor_profile",
    "Look up a previously-saved distributor profile by first_name + last_name or by distributor_name.",
    {
      first_name: z.string().optional().describe("First name"),
      last_name: z.string().optional().describe("Last name"),
      distributor_name: z.string().optional().describe("Direct distributor_name lookup"),
    },
    async (args) => proxyMcpTool("get_distributor_profile", args)
  );

  // ── Proxied tools — these forward to the original Netlify MCP server's
  // JSON-RPC handler. Each one is a thin wrapper that lets Claude call the
  // existing tool through the cleaner Render protocol path.

  server.tool(
    "get_skill_master",
    "Fetch the master skill playbook (master.md) with cache version envelope.",
    {},
    async (args) => proxyMcpTool("get_skill_master", args)
  );

  server.tool(
    "get_step",
    "Fetch a specific step file by name (e.g. 'step-2-domain').",
    { step_name: z.string().describe("Step file name without .md extension") },
    async (args) => proxyMcpTool("get_step", args)
  );

  server.tool(
    "get_template",
    "Fetch the raw HTML template for a page type (recruit, customer, thank-you-recruit, thank-you-customer).",
    { template_name: z.string().describe("Template name: recruit, customer, thank-you-recruit, thank-you-customer") },
    async (args) => proxyMcpTool("get_template", args)
  );

  server.tool(
    "get_styled_template",
    "Fetch a styled/branded version of a template with brand kit colors already applied.",
    {
      template_name: z.string().describe("Template name"),
      brand_kit_id: z.string().describe("Brand kit identifier"),
    },
    async (args) => proxyMcpTool("get_styled_template", args)
  );

  server.tool(
    "get_brand_kits",
    "Fetch all 10 brand kit definitions (colors, fonts, archetypes).",
    {},
    async (args) => proxyMcpTool("get_brand_kits", args)
  );

  server.tool(
    "get_personas",
    "Fetch the persona library used for marketing-copy generation.",
    {},
    async (args) => proxyMcpTool("get_personas", args)
  );

  server.tool(
    "get_persona_hooks",
    "Fetch hook templates by persona for content generation.",
    { persona_id: z.string().optional().describe("Persona identifier") },
    async (args) => proxyMcpTool("get_persona_hooks", args)
  );

  server.tool(
    "list_resources",
    "List all available resources (templates, brand kits, step files, etc.) with metadata.",
    {},
    async (args) => proxyMcpTool("list_resources", args)
  );

  server.tool(
    "substitute_and_publish",
    "Apply distributor data + brand kit to a template and publish the rendered HTML to the styled-pages store. Returns the Netlify URL of the rendered page.",
    {
      brand_kit_id: z.string().describe("Brand kit identifier"),
      template_name: z.string().describe("Template name"),
      distributor_data: z.record(z.any()).optional().describe("Distributor data object with first_name, last_name, story, etc."),
      photo_data_uris: z.record(z.string()).optional().describe("Photo slot → data URI map"),
      form_id: z.string().optional().describe("Kajabi form ID"),
      form_embed_js_url: z.string().optional().describe("Kajabi form embed JS URL"),
      video_url: z.string().optional().describe("Distributor-uploaded video URL"),
      page_slug: z.string().optional().describe("Canonical page slug"),
    },
    async (args) => proxyMcpTool("substitute_and_publish", args)
  );

  server.tool(
    "add_video_to_published_page",
    "Inject a video URL into an already-published page's video placeholder.",
    {
      distributor_name: z.string().describe("Distributor identifier"),
      template_name: z.string().describe("Template name (typically thank-you-recruit)"),
      video_url: z.string().describe("Distributor video URL"),
    },
    async (args) => proxyMcpTool("add_video_to_published_page", args)
  );

  server.tool(
    "get_latest_video_upload",
    "Fetch metadata about the most recent video upload for a distributor.",
    { distributor_name: z.string().describe("Distributor identifier") },
    async (args) => proxyMcpTool("get_latest_video_upload", args)
  );

  server.tool(
    "get_latest_photo_upload",
    "Fetch metadata about the most recent photo upload for a distributor.",
    {
      distributor_name: z.string().describe("Distributor identifier"),
      page: z.string().optional().describe("Page type: recruit or customer"),
    },
    async (args) => proxyMcpTool("get_latest_photo_upload", args)
  );

  server.tool(
    "start_customer_build",
    "Kick off the customer page build sequence with the distributor's saved data + brand kit.",
    {
      distributor_name: z.string().describe("Distributor identifier"),
      brand_kit_id: z.string().optional().describe("Brand kit (defaults to saved value)"),
    },
    async (args) => proxyMcpTool("start_customer_build", args)
  );

  server.tool(
    "start_recruit_build",
    "Kick off the team-member page build sequence with the distributor's saved data + brand kit.",
    {
      distributor_name: z.string().describe("Distributor identifier"),
      brand_kit_id: z.string().optional().describe("Brand kit (defaults to saved value)"),
    },
    async (args) => proxyMcpTool("start_recruit_build", args)
  );

  server.tool(
    "upload_distributor_photo_chunk",
    "Upload a photo chunk for a distributor (used as part of the chunked photo upload flow).",
    {
      distributor_name: z.string().describe("Distributor identifier"),
      slot: z.string().describe("Photo slot identifier"),
      chunk_index: z.number().describe("Chunk index"),
      total_chunks: z.number().describe("Total chunk count"),
      data_uri: z.string().describe("Base64 data URI"),
    },
    async (args) => proxyMcpTool("upload_distributor_photo_chunk", args)
  );

  return server;
}

// Forward an MCP tool call to the existing Netlify MCP server.
async function proxyMcpTool(toolName, args) {
  const url = `${NETLIFY_BASE}/mcp`;
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method: "tools/call",
        params: { name: toolName, arguments: args || {} },
      }),
    });
    const json = await r.json();
    if (json.error) throw new Error(json.error.message || String(json.error));
    const text = json.result?.content?.[0]?.text || JSON.stringify(json.result);
    return { content: [{ type: "text", text }] };
  } catch (e) {
    return {
      content: [{ type: "text", text: `${toolName} failed: ${e.message}` }],
      isError: true,
    };
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Express app + Streamable HTTP transport
// ──────────────────────────────────────────────────────────────────────────

const app = express();
app.use(express.json());

// Public base URL — used in OAuth metadata. Falls back to Render's external host.
const PUBLIC_BASE =
  process.env.PUBLIC_BASE ||
  (process.env.RENDER_EXTERNAL_URL ? process.env.RENDER_EXTERNAL_URL : "https://ai-wellness-mcp-render.onrender.com");

const NO_CACHE = {
  "Cache-Control": "no-cache, no-store, must-revalidate",
  "Pragma": "no-cache",
};

// Health check
app.get("/", (req, res) => {
  res.status(200).json({ ok: true, name: "ai-wellness-mcp-render", version: "0.1.0" });
});

// ──────────────────────────────────────────────────────────────────────────
// Fake OAuth for claude.ai connector compatibility
//
// claude.ai's connector framework requires OAuth registration even for
// servers that don't actually need authentication. These endpoints
// auto-approve everything silently so no distributor sees a login screen.
// ──────────────────────────────────────────────────────────────────────────

const STATIC_CLIENT_ID = "ai-wellness-public-anonymous-client";
const STATIC_ISSUED_AT = 1717200000;

app.get("/.well-known/oauth-protected-resource", (req, res) => {
  res.set(NO_CACHE).json({
    resource: `${PUBLIC_BASE}/mcp`,
    authorization_servers: [PUBLIC_BASE],
    bearer_methods_supported: ["header"],
  });
});

app.get("/.well-known/oauth-authorization-server", (req, res) => {
  res.set(NO_CACHE).json({
    issuer: PUBLIC_BASE,
    authorization_endpoint: `${PUBLIC_BASE}/oauth/authorize`,
    token_endpoint: `${PUBLIC_BASE}/oauth/token`,
    registration_endpoint: `${PUBLIC_BASE}/oauth/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token", "client_credentials"],
    code_challenge_methods_supported: ["S256", "plain"],
    token_endpoint_auth_methods_supported: ["none", "client_secret_post"],
    scopes_supported: ["mcp"],
  });
});

app.post("/oauth/register", (req, res) => {
  const reqBody = req.body || {};
  res.status(201).set(NO_CACHE).json({
    client_id: STATIC_CLIENT_ID,
    client_id_issued_at: STATIC_ISSUED_AT,
    client_name: "AI Wellness Public Client",
    redirect_uris: reqBody.redirect_uris || [],
    grant_types: reqBody.grant_types || ["authorization_code", "refresh_token"],
    response_types: reqBody.response_types || ["code"],
    token_endpoint_auth_method: "none",
  });
});

// /oauth/authorize — auto-approve, 302-redirect back with static code
app.get("/oauth/authorize", (req, res) => {
  const redirectUri = req.query.redirect_uri || "";
  const state = req.query.state || "";
  if (!redirectUri) {
    return res.status(400).json({ error: "missing redirect_uri" });
  }
  const url = new URL(redirectUri);
  url.searchParams.set("code", "auto-approved-code");
  if (state) url.searchParams.set("state", state);
  res.set(NO_CACHE).redirect(302, url.toString());
});

// /oauth/token — return a unique opaque token per request
app.post("/oauth/token", (req, res) => {
  const uniq = Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 12);
  res.status(200).set(NO_CACHE).json({
    access_token: "aiw_at_" + uniq,
    token_type: "Bearer",
    expires_in: 86400,
    refresh_token: "aiw_rt_" + uniq,
    scope: "mcp",
  });
});

// CORS preflight for all the above endpoints
app.options(["/mcp", "/oauth/*", "/.well-known/*"], (req, res) => {
  res
    .set({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, MCP-Protocol-Version, Mcp-Session-Id",
      "Access-Control-Max-Age": "600",
    })
    .status(204)
    .end();
});

// Session storage — transport per session ID so subsequent requests reach
// the same MCP server state.
const transports = new Map(); // sessionId -> { transport, server }

// MCP endpoint — Streamable HTTP transport per spec
// claude.ai connector framework hits this URL for the entire MCP protocol.
app.all("/mcp", async (req, res) => {
  try {
    const sessionId = req.headers["mcp-session-id"];
    let entry;

    if (sessionId && transports.has(sessionId)) {
      // Existing session — reuse transport + server
      entry = transports.get(sessionId);
    } else {
      // New session — fresh transport + server
      const server = buildMcp();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sid) => {
          transports.set(sid, { transport, server });
        },
      });
      transport.onclose = () => {
        if (transport.sessionId) transports.delete(transport.sessionId);
      };
      await server.connect(transport);
      entry = { transport, server };
    }

    await entry.transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("MCP error:", err);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error: " + err.message },
        id: null,
      });
    }
  }
});

app.listen(PORT, () => {
  console.log(`AI Wellness MCP (Render) listening on :${PORT}`);
  console.log(`Netlify backend: ${NETLIFY_BASE}`);
});
