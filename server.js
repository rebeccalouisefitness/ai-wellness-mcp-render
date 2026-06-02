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
    "Fetch the step file for a given phase number (1-9). Returns the markdown content used to drive that phase of the conversation.",
    {
      phase: z.string().describe("Phase number: 1 (welcome+brand voice), 2 (domain), 3 (Kajabi+brand kit), 4 (Calendly), 5 (team pages), 6 (customer pages), 7 (emails), 8 (ManyChat), 9 (launch)."),
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
        8: "step-7-emails.md",
        9: "step-8-publish.md",
      };
      const file = PHASE_FILES[String(phase)];
      if (!file) {
        return {
          content: [{ type: "text", text: `Unknown phase: ${phase}. Valid phases are 1-9.` }],
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
  server.tool(
    "save_distributor_profile",
    "Save or update the user's profile (brand voice answers, name, country, etc). Profiles persist across sessions.",
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
    async (args) => {
      // The existing Netlify MCP still has get_distributor_profile via its MCP
      // tool, but we can also expose this via the HTTP save endpoint's GET form
      // (which writes-but-also-returns) or build a dedicated /api/get endpoint.
      // For the minimal proof we'll call the existing Netlify MCP's JSON-RPC.
      const url = `${NETLIFY_BASE}/mcp`;
      try {
        const r = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "tools/call",
            params: {
              name: "get_distributor_profile",
              arguments: args,
            },
          }),
        });
        const json = await r.json();
        if (json.error) throw new Error(json.error.message);
        const text = json.result?.content?.[0]?.text || JSON.stringify(json.result);
        return { content: [{ type: "text", text }] };
      } catch (e) {
        return {
          content: [{ type: "text", text: `Profile fetch failed: ${e.message}` }],
          isError: true,
        };
      }
    }
  );

  return server;
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
