-- 059 — downgrade-only consistency (SCORING_SPEC v1.4 §5d)
--
-- WHY
-- Consistency was a scored 0-2 dimension in which a single-source signal scored 1,
-- documented as "neutral, not penalized". Measured over the 226 active signals, 174
-- (77%) sat at exactly 1, of which the overwhelming majority were single-document
-- signals. The dimension was therefore contributing a fixed +1 to most of the corpus
-- rather than measuring anything: combined with specificity (67% at max) it produced a
-- 3-point floor before any real judgement, which is the mechanical cause of 74% of
-- signals landing in one tier.
--
-- Consistency now follows GRADE, where inconsistency can only *downgrade* certainty and
-- never add it:
--     0  = sources agree, OR there is a single source so agreement is not assessable
--    -1  = sources point in mixed directions
--    -2  = direct conflict on the primary outcome
--
-- arm_strength therefore becomes four scored dimensions (0-2 each) plus a penalty,
-- floored at zero: range 0-8 instead of 0-10.
--
-- Be clear about what this does and does not buy. It is a COHERENCE fix, not a
-- discrimination fix. After the change 202 of 226 signals sit at consistency 0, so as a
-- variance contributor the dimension becomes *more* degenerate (89% at one value, up from
-- 77%). What it removes is a meaningless additive constant; the distribution shifts left
-- by about a point and keeps its shape. It is worth doing because it stops inflating every
-- score by a point that was never earned, it makes recorded contradictions actually cost
-- something (§4), and downgrade-only inconsistency is legible to an external
-- methodologist in a way that "a single study earns +1 for neutrality" is not.
--
-- SAFETY: THIS MIGRATION IS A NO-OP ON EXISTING ROWS.
-- GREATEST(0, a+b+c+d+e) is arithmetically identical to (a+b+c+d+e) whenever every term
-- is non-negative, which is true of all current data. Verified before applying:
--   rows where arm_strength <> GREATEST(0, sum)  -> 0 of 228
--   rows where arm_score    <> round(LEAST(10, GREATEST(0,sum)*mult),1) -> 0 of 228
--   rows where consistency_score < 0 -> 0 of 228
-- So this can land before the rescore without changing a single displayed value. The
-- corpus keeps v1.3 semantics (consistency 0..2) until the single rescore rewrites it
-- with v1.4 semantics (-2..0), and both are computed correctly by the same expression.

begin;

-- 1. Allow negative consistency. The target range is -2..0, but existing rows still hold
--    0..2 under v1.3 semantics, so a -2..0 constraint would fail validation right now.
--    This transitional -2..2 window is tightened to -2..0 in the follow-up migration that
--    accompanies the rescore, once no positive values remain.
alter table public.substrate_signals
  drop constraint if exists substrate_signals_consistency_score_check;

alter table public.substrate_signals
  add constraint substrate_signals_consistency_score_check
  check (consistency_score >= -2 and consistency_score <= 2);

comment on column public.substrate_signals.consistency_score is
  'Downgrade-only consistency penalty (SCORING_SPEC v1.4 §5d): 0 = sources agree or single '
  'source so not assessable; -1 = mixed direction; -2 = direct conflict on the primary '
  'outcome. Never positive. Transitional CHECK still permits 0..2 while pre-rescore rows '
  'carry v1.3 semantics.';

-- 2. Redefine the generated columns with an explicit floor at zero. Generated columns
--    cannot be altered in place and cannot reference one another, so arm_score repeats
--    the sum rather than reading arm_strength. Dropping arm_score also drops
--    idx_subsig_score, which is recreated in step 3.
alter table public.substrate_signals drop column arm_score;
alter table public.substrate_signals drop column arm_strength;

alter table public.substrate_signals
  add column arm_strength numeric generated always as (
    greatest(0,
        coalesce(corroboration_score, 0)
      + coalesce(rigor_score, 0)
      + coalesce(specificity_score, 0)
      + coalesce(plausibility_score, 0)
      + coalesce(consistency_score, 0)
    )
  ) stored;

-- The LEAST(10.0, ...) cap is retained deliberately rather than lowered to 8.0. The v1.4
-- ceiling really is 8, so the cap can never bind on post-rescore data, but pre-rescore
-- rows reach arm_strength 9 and lowering the cap now would silently change arm_score for
-- the 12 signals currently at 8-9 and move them between tiers. Left at 10.0 so this
-- migration stays a genuine no-op; it can be lowered after the rescore as a tidy-up.
alter table public.substrate_signals
  add column arm_score numeric generated always as (
    round(
      least(10.0,
        greatest(0,
            coalesce(corroboration_score, 0)
          + coalesce(rigor_score, 0)
          + coalesce(specificity_score, 0)
          + coalesce(plausibility_score, 0)
          + coalesce(consistency_score, 0)
        )::numeric * coalesce(female_applicability_multiplier, 1.00)
      ), 1)
  ) stored;

comment on column public.substrate_signals.arm_strength is
  'Pre-multiplier evidence strength, 0-8 under v1.4: corroboration + rigor + specificity + '
  'plausibility (0-2 each) plus the consistency penalty (-2..0), floored at 0. This is the '
  'column tiers are assigned on (SCORING_SPEC §5); arm_score is for rank and display only.';

comment on column public.substrate_signals.arm_score is
  'arm_strength x female-applicability multiplier. Drives RANK AND DISPLAY ONLY — tiers are '
  'assigned on arm_strength (SCORING_SPEC §1), so that strong-but-may-not-transfer evidence '
  'is ranked below, not retiered beneath, moderate-but-applicable evidence.';

-- 3. Recreate the index dropped with arm_score.
create index if not exists idx_subsig_score
  on public.substrate_signals using btree (arm_score desc);

commit;

-- NOT DONE HERE, and deliberately so:
--   * confidence_tier still holds v1.3 four-tier values and its CHECK still permits
--     'Moderate'. The v1.4 three-tier cutoffs are derived on the arm_strength lattice
--     under the placement rules in §5b, which cannot be done until the rescore produces
--     the post-change distribution. Tier values written between now and then are
--     provisional and should not be treated as authoritative.
--   * The consistency CHECK is not yet tightened to -2..0 (see step 1).
--   * The arm_score cap is not yet lowered from 10.0 to 8.0 (see step 2).
