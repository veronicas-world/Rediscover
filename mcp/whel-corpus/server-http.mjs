#!/usr/bin/env node
// Whel Corpus MCP server — HTTPS entrypoint (for clients that require https and
// can't launch a local command, e.g. Claude Science whose safeFetch is
// https-only). Serves over TLS on localhost with a self-signed cert, so nothing
// is exposed off your machine.
//
//   node /Users/veronicaagudelo/rediscover/mcp/whel-corpus/server-http.mjs
//   → then add it in Claude Science → Connectors → Remote with URL
//        https://localhost:4000/mcp
//
// Env: PORT (default 4000); MCP_PLAIN_HTTP=1 to serve plain http instead.
// Leave this terminal running while you use the connector. Descriptive research
// context, human-in-the-loop; NOT clinical or regulatory advice.
import http from "node:http";
import https from "node:https";
import { randomUUID } from "node:crypto";
import selfsigned from "selfsigned";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { registerTools } from "./tools.mjs";

const PORT = Number(process.env.PORT) || 4000;
const PATHNAME = "/mcp";
const PLAIN = process.env.MCP_PLAIN_HTTP === "1";

const transports = new Map();

function newSession() {
  const server = new McpServer({ name: "whel-corpus", version: "1.0.0" });
  registerTools(server);
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: (sid) => transports.set(sid, transport),
  });
  transport.onclose = () => { if (transport.sessionId) transports.delete(transport.sessionId); };
  server.connect(transport);
  return transport;
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  if (!chunks.length) return undefined;
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { return undefined; }
}

const handler = async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname !== PATHNAME) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "not found; use " + PATHNAME }));
    return;
  }
  const sid = req.headers["mcp-session-id"];
  let transport = sid && transports.get(sid);
  try {
    if (!transport) {
      if (req.method !== "POST") {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32000, message: "No session; send an initialize POST first." }, id: null }));
        return;
      }
      transport = newSession();
      await transport.handleRequest(req, res, await readBody(req));
      return;
    }
    const body = req.method === "POST" ? await readBody(req) : undefined;
    await transport.handleRequest(req, res, body);
  } catch (err) {
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32603, message: String(err?.message ?? err) }, id: null }));
    }
  }
};

let server;
let scheme;
if (PLAIN) {
  server = http.createServer(handler);
  scheme = "http";
} else {
  const pems = selfsigned.generate(
    [{ name: "commonName", value: "localhost" }],
    {
      days: 3650,
      keySize: 2048,
      algorithm: "sha256",
      extensions: [{ name: "subjectAltName", altNames: [{ type: 2, value: "localhost" }, { type: 7, ip: "127.0.0.1" }] }],
    },
  );
  server = https.createServer({ key: pems.private, cert: pems.cert }, handler);
  scheme = "https";
}

server.listen(PORT, "127.0.0.1", () => {
  console.error(`Whel Corpus MCP listening on ${scheme}://localhost:${PORT}${PATHNAME}`);
  console.error(`Add it in Claude Science → Connectors → Remote with that URL. Leave this running.`);
  if (scheme === "https") console.error("(self-signed cert; nothing leaves your machine)");
});
