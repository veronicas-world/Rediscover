/**
 * Single gate for all signal-rendering routes.
 *
 * When false, every route that renders a signal, grade, tier, count of signals,
 * or featured card shows a shared "coming soon" component instead. The
 * methodology, signal-types, about, and changelog routes stay fully visible.
 *
 * *** NOT SAFE TO FLIP YET — see PRE-PUBLISH-CHECKLIST.md ***
 *
 * Before this can flip to true, every item in PRE-PUBLISH-CHECKLIST.md (in
 * this directory) must be resolved. The checklist tracks the gated components
 * that still carry local four-tier definitions, the TIER_CUTOFFS that need
 * re-derivation on the post-rescore lattice, and other blockers.
 */
export const SIGNALS_PUBLISHED = false;
