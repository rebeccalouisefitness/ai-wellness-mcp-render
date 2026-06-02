# AI Wellness MCP — Render

Thin MCP protocol wrapper hosted on Render. Uses the official `@modelcontextprotocol/sdk` for spec-perfect Streamable HTTP transport. All data operations delegate to the existing Netlify deployment (`https://ai-wellness-business.netlify.app`).

## Why this exists

The custom MCP server inside the Netlify Function had subtle protocol compatibility issues with claude.ai's connector framework — claude.ai would initialize successfully but never call `tools/list`, leaving the UI in a "no tools available" state. This Render deployment uses the official SDK to eliminate protocol bugs as a variable.

## Local development

```bash
npm install
npm start
```

Server runs on `http://localhost:3000`. MCP endpoint at `/mcp`.

## Deploy on Render

1. Push to a GitHub repo.
2. Render Dashboard → New + → Web Service → connect the repo.
3. Build command: `npm install`
4. Start command: `npm start`
5. Public URL becomes the MCP endpoint (e.g. `https://ai-wellness-mcp.onrender.com/mcp`).

## Connector setup

Add to claude.ai custom connectors:

```
URL: https://<your-render-host>.onrender.com/mcp
```

## Environment variables

- `NETLIFY_BASE` — Defaults to `https://ai-wellness-business.netlify.app`. Override if the Netlify backend moves.
- `PORT` — Render injects this automatically.
