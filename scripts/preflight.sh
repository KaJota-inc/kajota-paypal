#!/usr/bin/env bash
#
# preflight.sh — one-command "is this submission reproducible?" check.
#
# Per [[project_keeperhub_hackathon]], Keeperhub winners shipped exactly
# this kind of script so a reviewer could gate the whole substrate in
# under a minute without a mental checklist. We do the same.
#
# Runs: typecheck · lint · production build · happy-path reproducer ·
# 7-gate adversarial table · git status. Non-zero exit on any failure.
#
# Usage:
#   pnpm preflight                 # from the repo root
#   bash scripts/preflight.sh      # directly

set -euo pipefail
set -o errtrace

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

START=$(date +%s)
LOGDIR="$(mktemp -d -t kajota-paypal-preflight.XXXXXX)"
trap 'rm -rf "$LOGDIR"' EXIT

green() { printf "\033[1;32m%s\033[0m\n" "$*"; }
red()   { printf "\033[1;31m%s\033[0m\n" "$*"; }
dim()   { printf "\033[2m%s\033[0m\n" "$*"; }
banner() {
  printf "\n\033[1;34m══ %s\033[0m\n" "$*"
}

report_fail() {
  local label="$1" log="$2"
  red "  ✗ $label"
  dim "  Last 25 lines of $log:"
  tail -25 "$log" | sed 's/^/    /'
  exit 1
}

banner "preflight · $(date -u +%Y-%m-%dT%H:%M:%SZ) · HEAD $(git rev-parse --short HEAD)"
dim "  logs under $LOGDIR"

banner "typecheck"
if pnpm exec tsc --noEmit > "$LOGDIR/typecheck.log" 2>&1; then
  green "  ✓ 0 errors"
else
  report_fail "typecheck failed" "$LOGDIR/typecheck.log"
fi

banner "lint"
if pnpm lint > "$LOGDIR/lint.log" 2>&1; then
  green "  ✓ 0 errors"
else
  report_fail "lint failed" "$LOGDIR/lint.log"
fi

banner "build"
if pnpm build > "$LOGDIR/build.log" 2>&1; then
  routes=$(grep -cE "^(├|└) [ƒ○]" "$LOGDIR/build.log" || true)
  green "  ✓ ${routes:-?} routes compiled"
else
  report_fail "build failed" "$LOGDIR/build.log"
fi

banner "happy path · pnpm reproduce"
if pnpm reproduce > "$LOGDIR/reproduce.log" 2>&1; then
  green "  ✓ pipeline settles end-to-end (no env, no chain, no server)"
else
  report_fail "reproducer failed" "$LOGDIR/reproduce.log"
fi

banner "adversarial · pnpm reproduce:fail"
if pnpm reproduce:fail > "$LOGDIR/reproduce-fail.log" 2>&1; then
  fired=$(grep -E "✓ [0-9]+/[0-9]+ gates fired" "$LOGDIR/reproduce-fail.log" | tail -1)
  green "  ✓ ${fired:-gates fired}"
else
  report_fail "adversarial table missed a gate" "$LOGDIR/reproduce-fail.log"
fi

banner "git state"
if git diff --quiet && git diff --cached --quiet; then
  green "  ✓ working tree clean"
else
  dim "  Uncommitted changes (preflight does not block on these):"
  git status --short | sed 's/^/    /'
fi

ELAPSED=$(( $(date +%s) - START ))
echo
printf "\033[1;32m══ All green in %ds. Submission package is reproducible.\033[0m\n" "$ELAPSED"
printf "   Open \033[1;36mhttps://kajota-paypal.vercel.app/evidence\033[0m to verify live settlements once deployed.\n"
