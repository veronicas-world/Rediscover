-- ================================================================
-- 015  Remove duplicate entries from the sources table.
--
--      A duplicate is defined as two or more rows sharing the same
--      (signal_id, url) pair. For each such group, keep the row
--      with the smallest id (first inserted) and delete the rest.
--
--      Also removes any remaining generic subreddit URLs that were
--      not caught by migration 014 (belt-and-suspenders cleanup).
-- ================================================================

BEGIN;

-- Step 1: Delete duplicate (signal_id, url) rows, keeping the first
DELETE FROM sources
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY signal_id, url
             ORDER BY id
           ) AS rn
    FROM sources
    WHERE url IS NOT NULL
  ) ranked
  WHERE rn > 1
);

-- Step 2: Belt-and-suspenders cleanup of any remaining generic
-- reddit subreddit URLs that lack an individual post permalink
DELETE FROM sources
WHERE source_type = 'reddit'
  AND url NOT LIKE '%/comments/%';

COMMIT;
