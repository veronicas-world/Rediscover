#!/usr/bin/env node
// Whel Corpus MCP server — stdio entrypoint.
// Exposes Whel's curated drug-repurposing corpus (every candidate the site
// surfaces, tiered, with evidence + regulatory/MATRIX/sex-PK side-layers) to an
// MCP client. Descriptive research context, human-in-the-loop; NOT advice.
// Data: lib/corpus-snapshot.json (built by scripts/build-corpus-snapshot.mjs).
//
// If your MCP client sandboxes local commands and can't reach this file path
// (e.g. Claude Science), use the HTTP entrypoint instead: `node server-http.mjs`.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools } from "./tools.mjs";

const server = new McpServer({ name: "whel-corpus", version: "1.0.0" });
registerTools(server);
await server.connect(new StdioServerTransport());
