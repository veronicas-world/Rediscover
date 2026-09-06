// Deployed MCP endpoint — exposes Whel's curated corpus to MCP clients
// (Claude Science, etc.) over HTTPS, always-on, on Vercel. Gated by a secret
// key (WHEL_MCP_KEY), so the corpus is not openly public. Descriptive research
// context; NOT advice.
//
// Auth: pass the key in the Authorization header:
//   Authorization: Bearer YOUR_KEY
// (The x-whel-key header is also accepted. The ?key=YOUR_KEY query-string path
// is kept as a deprecated fallback so existing connector configs keep working,
// but it should be removed once clients migrate — secrets in URLs land in
// access logs and browser history.)
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import * as corpus from "@/lib/corpus-query";
import { SIGNALS_PUBLISHED } from "@/lib/site-config";

export const maxDuration = 30;

const ok = (obj: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(obj, null, 2) }] });

const handler = createMcpHandler(
  (server) => {
    server.tool(
      "whel_corpus_meta",
      "Overview of the whole Whel corpus: build date, total candidate count, the six conditions, and the tier + curation distribution. Call this first.",
      {},
      async () => ok(corpus.meta()),
    );
    server.tool(
      "whel_list_candidates",
      "List/filter Whel candidates as compact summaries. Defaults to the clean single-agent drug index (what the site shows). Filters: condition, tier, arm, regulatory (on-label/off-label/no-label/generic), drug substring, curationClass ('all' includes combinations/supplements/excluded/class). Paginated.",
      {
        condition: z.string().optional(),
        tier: z.enum(["strong", "emerging", "exploratory"]).optional(),
        arm: z.enum(["direct", "pathway", "community"]).optional(),
        regulatory: z.enum(["on-label", "off-label", "no-label", "generic"]).optional(),
        curationClass: z.enum(["drug", "combination", "supplement", "exclude", "class", "all"]).optional(),
        drug: z.string().optional(),
        limit: z.number().int().min(1).max(500).optional(),
        offset: z.number().int().min(0).optional(),
      },
      async (args) => ok(corpus.list(args)),
    );
    server.tool(
      "whel_get_candidate",
      "Full curated record for one candidate: tier, score, per-arm four-dimension scores + rationales, female-applicability, rationale, mechanism, verbatim claims, and side-layers (regulatory, MATRIX, sex-PK). Identify by signalId, id (WHEL-C-001), or drug + condition.",
      { signalId: z.string().optional(), id: z.string().optional(), drug: z.string().optional(), condition: z.string().optional() },
      async (args) => ok(corpus.get(args)),
    );
    server.tool(
      "whel_evidence",
      "Evidence trail for one candidate: rationale, mechanism, the four dimension scores + rationales, verbatim source claims, and regulatory reads. Use to check WHY Whel graded a pair. Identify by signalId, id, or drug + condition.",
      { signalId: z.string().optional(), id: z.string().optional(), drug: z.string().optional(), condition: z.string().optional() },
      async (args) => ok(corpus.evidence(args)),
    );
    server.tool(
      "whel_search",
      "Free-text search across every candidate's drug, condition, rationale, mechanism, drug class, and verbatim claims. Returns ranked summaries.",
      { query: z.string(), limit: z.number().int().min(1).max(200).optional() },
      async ({ query, limit }) => ok(corpus.search(query, limit)),
    );
    server.tool(
      "whel_condition_summary",
      "Per-condition tier distribution + full candidate list (one condition, or all six if omitted).",
      { condition: z.string().optional() },
      async ({ condition }) => ok(corpus.conditionSummary(condition)),
    );
  },
  {},
  { basePath: "/api" },
);

/** Constant-time string comparison so the key check is not a timing oracle. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

function authorized(req: Request): boolean {
  const secret = process.env.WHEL_MCP_KEY;
  if (!secret) return false;
  // Prefer the Authorization: Bearer header (secrets in headers are not logged
  // the way query-string secrets are). The x-whel-key header is also accepted.
  const authHeader = req.headers.get("authorization") ?? "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const key = bearer
    || req.headers.get("x-whel-key")
    || new URL(req.url).searchParams.get("key"); // deprecated fallback
  if (!key) return false;
  return timingSafeEqual(key, secret);
}

async function gated(req: Request): Promise<Response> {
  if (!authorized(req)) {
    return new Response(
      JSON.stringify({ jsonrpc: "2.0", error: { code: -32001, message: "Unauthorized: missing or invalid key." }, id: null }),
      { status: 401, headers: { "content-type": "application/json" } },
    );
  }
  if (!SIGNALS_PUBLISHED) {
    return new Response(
      JSON.stringify({ jsonrpc: "2.0", error: { code: -32003, message: "Signals are being regraded under methodology v4.3. Data will be available when the regrade completes." }, id: null }),
      { status: 503, headers: { "content-type": "application/json" } },
    );
  }
  return handler(req);
}

export { gated as GET, gated as POST, gated as DELETE };
