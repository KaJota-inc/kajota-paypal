#!/usr/bin/env bash
# Rehearsal driver for concordium/DEMO_VIDEO_VO_SCRIPT.md
#
# Hits every live URL in the Concordium submission in the order the
# 3-minute demo video needs them, so you can confirm the surfaces are
# healthy before you hit record. Run this once, in the terminal pane
# you'll record from, ten minutes before the take.
#
# Exits non-zero if any surface returns a non-2xx status.
set -euo pipefail

BASE="${BASE:-https://kajota-paypal.vercel.app}"
C="\033[36m"; G="\033[32m"; R="\033[31m"; DIM="\033[2m"; OFF="\033[0m"

echo -e "${DIM}Rehearsing against:${OFF} ${BASE}"
echo

check() {
  local label="$1" url="$2" expect="${3:-200}" method="${4:-GET}"
  printf "  %-38s " "$label"
  local code
  code=$(curl -sS -X "$method" -o /dev/null -w "%{http_code}" "$url")
  if [[ "$code" == "$expect" ]]; then
    printf "${G}%s${OFF}\n" "$code"
  else
    printf "${R}%s (expected %s)${OFF}\n" "$code" "$expect"
    exit 1
  fi
}

echo -e "${C}Beat 1 — Landing (0:05)${OFF}"
check "GET /"                                   "${BASE}/"

echo -e "${C}Beat 2 — Buyer /chat SSE (0:20)${OFF}"
check "GET /chat"                               "${BASE}/chat"
check "POST /api/chat (SSE head)"               "${BASE}/api/chat" 200 POST

echo -e "${C}Beat 3 — Mandate Inspector panel (0:50)${OFF}"
check "POST /api/orchestrator/sessions/seed"    "${BASE}/api/orchestrator/sessions/seed" 200 POST
check "GET /mandate-inspector/pm_stub_0001"     "${BASE}/mandate-inspector/pm_stub_0001"
check "GET /api/mandate/receipt/pm_stub_0001"   "${BASE}/api/mandate/receipt/pm_stub_0001"

echo -e "${C}Beat 4 — demo.mjs four-state taxonomy (1:20)${OFF}"
if (cd "$(dirname "$0")/.." && node concordium/demo.mjs > /tmp/concordium-demo.out 2>&1); then
  if grep -q "Paid 1 of 4; refused 3" /tmp/concordium-demo.out; then
    printf "  %-38s ${G}pass${OFF}\n" "demo.mjs 4 cases / 3 refusals / 1 paid"
  else
    printf "  %-38s ${R}fail${OFF}\n" "demo.mjs expected pattern missing"
    cat /tmp/concordium-demo.out; exit 1
  fi
else
  printf "  %-38s ${R}exited non-zero${OFF}\n" "demo.mjs"
  cat /tmp/concordium-demo.out; exit 1
fi

echo -e "${C}Beat 5 — x402 sponsored-fee pay (1:50)${OFF}"
if (cd "$(dirname "$0")/.." && node concordium/x402-pay.mjs > /tmp/x402.out 2>&1); then
  if grep -q "skipped" /tmp/x402.out; then
    printf "  %-38s ${DIM}skipped (env unset)${OFF}\n" "x402-pay.mjs"
    echo -e "    ${DIM}Set CONCORDIUM_X402_FACILITATOR_URL + CONCORDIUM_X402_FEE_PAYER in .env.local to fire for real.${OFF}"
  else
    printf "  %-38s ${G}paid${OFF}\n" "x402-pay.mjs"
  fi
else
  printf "  %-38s ${R}exited non-zero${OFF}\n" "x402-pay.mjs"
  cat /tmp/x402.out; exit 1
fi

echo -e "${C}Beat 6 — MCP endpoint + Agent Card (2:20)${OFF}"
check "GET /api/mcp (self-description)"         "${BASE}/api/mcp"
check "GET /.well-known/agent-card.json"        "${BASE}/.well-known/agent-card.json"
mcp_tools=$(curl -sS -X POST "${BASE}/api/mcp" \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | python3 -c 'import sys,json; r=json.load(sys.stdin); t=json.loads(r["result"]["content"][0]["text"]); print(",".join(x["name"] for x in t["tools"]))')
if [[ "$mcp_tools" == "buyer_chat.plan,concordium.verify" ]]; then
  printf "  %-38s ${G}%s${OFF}\n" "tools/list" "$mcp_tools"
else
  printf "  %-38s ${R}%s${OFF}\n" "tools/list" "$mcp_tools"
  exit 1
fi

echo -e "${C}Beat 7 — README section (2:45)${OFF}"
check "GET github.com/.../README.md"           "https://raw.githubusercontent.com/KaJota-inc/kajota-paypal/feat/mandate-beacon-ap2-plug/README.md"

echo
echo -e "${G}All surfaces healthy. You're clear to record.${OFF}"
echo -e "${DIM}Script to read: concordium/DEMO_VIDEO_VO_SCRIPT.md${OFF}"
