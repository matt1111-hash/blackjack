#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_PATH="$ROOT_DIR/.quality_gate.conf"
MODE="local"

if [[ "${1:-}" == "--ci" ]]; then
  MODE="ci"
fi

if [[ ! -f "$CONFIG_PATH" ]]; then
  echo "Missing config: $CONFIG_PATH" >&2
  exit 1
fi

# shellcheck disable=SC1090
source "$CONFIG_PATH"

if [[ "$MODE" == "ci" ]]; then
  MIN_LINES="$CI_MIN_LINES"
  MIN_FUNCTIONS="$CI_MIN_FUNCTIONS"
else
  MIN_LINES="$LOCAL_MIN_LINES"
  MIN_FUNCTIONS="$LOCAL_MIN_FUNCTIONS"
fi

run_step() {
  local label="$1"
  shift

  echo
  echo "==> $label"
  "$@"
}

extract_metric() {
  local metric="$1"

  node -e '
const fs = require("node:fs");
const [summaryPath, metricName] = process.argv.slice(1);
const report = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
const value = report.total?.[metricName]?.pct;
if (typeof value !== "number") {
  console.error(`Missing coverage metric: ${metricName}`);
  process.exit(1);
}
process.stdout.write(String(value));
' "$ROOT_DIR/$COVERAGE_SUMMARY_PATH" "$metric"
}

run_step "Lint" npm run lint
run_step "Typecheck" npm run typecheck
run_step "Tests" npm run test:run
run_step "Coverage" npm run test:coverage

if [[ ! -f "$ROOT_DIR/$COVERAGE_SUMMARY_PATH" ]]; then
  echo "Coverage summary not found: $ROOT_DIR/$COVERAGE_SUMMARY_PATH" >&2
  exit 1
fi

LINES_PCT="$(extract_metric lines)"
FUNCTIONS_PCT="$(extract_metric functions)"

echo
echo "Coverage thresholds ($MODE mode)"
echo "lines: $LINES_PCT% (min: $MIN_LINES%)"
echo "functions: $FUNCTIONS_PCT% (min: $MIN_FUNCTIONS%)"

node -e '
const [lines, minLines, functions, minFunctions] = process.argv.slice(1).map(Number);
const failures = [];
if (lines < minLines) {
  failures.push(`lines ${lines}% < ${minLines}%`);
}
if (functions < minFunctions) {
  failures.push(`functions ${functions}% < ${minFunctions}%`);
}
if (failures.length > 0) {
  console.error(`Coverage check failed: ${failures.join(", ")}`);
  process.exit(1);
}
' "$LINES_PCT" "$MIN_LINES" "$FUNCTIONS_PCT" "$MIN_FUNCTIONS"

run_step "Build" npm run build

echo
echo "Quality gate passed ($MODE mode)"
