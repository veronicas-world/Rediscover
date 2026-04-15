-- 025_fix_spm_label.sql
-- Fix label contradiction: SPMs shown as "FDA Approved" but are endogenous lipid mediators
-- Specialized Pro-Resolving Mediators (resolvins, protectins, maresins) are not approved drugs
-- Generated: 2026-04-15

UPDATE compounds SET
  fda_status = 'Not FDA-Approved (endogenous lipid mediators)',
  drug_class = 'Endogenous lipid mediators (omega-3 derived pro-resolving mediators)'
WHERE name ILIKE '%pro-resolving%'
   OR name ILIKE '%SPM%'
   OR name ILIKE '%resolvin%'
   OR name ILIKE '%protectin%'
   OR name ILIKE '%maresins%';
