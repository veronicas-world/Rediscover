/**
 * Single gate for all signal-rendering routes.
 *
 * When false, every route that renders a signal, grade, tier, count of signals,
 * or featured card shows a shared "coming soon" component instead. The
 * methodology, signal-types, about, and changelog routes stay fully visible.
 *
 * Flipping this to true is the only change needed to restore the site.
 */
export const SIGNALS_PUBLISHED = false;
