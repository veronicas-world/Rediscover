-- 019_reset_signals.sql
-- Full reset of signals, sources, and compounds
-- Does NOT touch the conditions table
-- Generated: 2026-04-15

-- Order matters: sources references repurposing_signals, repurposing_signals references compounds
DELETE FROM sources;
DELETE FROM repurposing_signals;
DELETE FROM compounds;
