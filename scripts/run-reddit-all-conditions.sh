#!/usr/bin/env bash
# Run the Reddit community pipeline for all 6 conditions and save SQL output.
# Usage: bash scripts/run-reddit-all-conditions.sh
# Output: scripts/sql/reddit-<condition>.sql (one file per condition)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="${SCRIPT_DIR}/sql"

mkdir -p "${OUTPUT_DIR}"

CONDITIONS=(
  "endometriosis"
  "adenomyosis"
  "pmdd"
  "pcos"
  "menopause"
  "vulvodynia"
)

for condition in "${CONDITIONS[@]}"; do
  echo ""
  echo "=========================================="
  echo "Running pipeline: ${condition}"
  echo "=========================================="

  outfile="${OUTPUT_DIR}/reddit-${condition}.sql"

  node "${SCRIPT_DIR}/reddit-pipeline.js" "${condition}" > "${outfile}"

  echo "Saved to: ${outfile}"
done

echo ""
echo "All conditions complete."
echo "SQL files are in: ${OUTPUT_DIR}/"
echo ""
echo "To apply to Supabase, run each file through the Supabase SQL editor"
echo "or: cat ${OUTPUT_DIR}/reddit-*.sql | psql <connection-string>"
