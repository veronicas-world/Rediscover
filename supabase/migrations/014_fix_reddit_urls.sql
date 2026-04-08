-- ================================================================
-- 014  Remove reddit source rows that point to generic subreddit
--      pages rather than individual post permalinks.
--
--      Individual post URLs contain "/comments/" in the path.
--      Generic subreddit URLs (e.g. https://www.reddit.com/r/Endo)
--      do not. The latter are not useful as citations.
-- ================================================================

DELETE FROM sources
WHERE source_type = 'reddit'
  AND url NOT LIKE '%/comments/%';
