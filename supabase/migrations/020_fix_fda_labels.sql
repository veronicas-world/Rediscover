-- 020_fix_fda_labels.sql
-- Fix fda_status for supplements incorrectly labeled as FDA Approved
-- Generated: 2026-04-15

UPDATE compounds SET fda_status = 'Dietary Supplement'
WHERE name ILIKE '%curcumin%';

UPDATE compounds SET fda_status = 'Dietary Supplement'
WHERE name ILIKE '%epigallocatechin%';

UPDATE compounds SET fda_status = 'Dietary Supplement'
WHERE name ILIKE '%resveratrol%';

UPDATE compounds SET fda_status = 'Dietary Supplement'
WHERE name ILIKE '%chinese herbal%';

UPDATE compounds SET fda_status = 'Dietary Supplement'
WHERE name ILIKE '%silymarin%';

UPDATE compounds SET fda_status = 'Dietary Supplement'
WHERE name ILIKE '%inositol%';

UPDATE compounds SET fda_status = 'Dietary Supplement'
WHERE name ILIKE '%vitamin d%';

UPDATE compounds SET fda_status = 'Dietary Supplement'
WHERE name ILIKE '%ergocalciferol%';
