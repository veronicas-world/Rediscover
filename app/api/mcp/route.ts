// Deployed MCP endpoint — exposes Whel's curated corpus to MCP clients
// (Claude Science, etc.) over HTTPS, always-on, on Vercel. Gated by a secret
// key in the query string (?key=...), checked against WHEL_MCP_KEY, so the
// corpus is not openly public. Descriptive research context; NOT advice.
//
// Connect from Claude Science → Connectors → Remote with:
//   https://whel.bio/api/mcp?key=YOUR_KEY
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import * as corpus from "@/lib/corpus-query";

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
        tier: z.enum(["strong", "moderate", "emerging", "exploratory"]).optional(),
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
      "Full curated record for one candidate: tier, score, per-arm five-dimension scores + rationales, female-applicability, rationale, mechanism, verbatim claims, and side-layers (regulatory, MATRIX, sex-PK). Identify by signalId, id (WHEL-C-001), or drug + condition.",
      { signalId: z.string().optional(), id: z.string().optional(), drug: z.string().optional(), condition: z.string().optional() },
      async (args) => ok(corpus.get(args)),
    );
    server.tool(
      "whel_evidence",
      "Evidence trail for one candidate: rationale, mechanism, the five dimension scores + rationales, verbatim source claims, and regulatory reads. Use to check WHY Whel graded a pair. Identify by signalId, id, or drug + condition.",
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

function authorized(req: Request): boolean {
  const secret = process.env.WHEL_MCP_KEY;
  if (!secret) return false;
  const url = new URL(req.url);
  const key = url.searchParams.get("key") ?? req.headers.get("x-whel-key");
  return key === secret;
}

async function gated(req: Request): Promise<Response> {
  if (!authorized(req)) {
    return new Response(
      JSON.stringify({ jsonrpc: "2.0", error: { code: -32001, message: "Unauthorized: missing or invalid key." }, id: null }),
      { status: 401, headers: { "content-type": "application/json" } },
    );
  }
  return handler(req);
}

export { gated as GET, gated as POST, gated as DELETE };
