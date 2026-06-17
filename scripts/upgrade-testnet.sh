#!/usr/bin/env bash
set -euo pipefail

UPGRADE_CAP="0x126e39a89de37c30ab60de298d2524bbef2266bbcbad3c05e2a67d8b2aa4f051"
ADDR=$(sui client active-address)

echo "Wallet: $ADDR"
echo "Balance:"
sui client gas

BAL=$(sui client gas --json 2>/dev/null | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);const t=j.result?.data?.reduce((s,x)=>s+BigInt(x.coinBalance),0n)||0n;console.log(t.toString())}catch{console.log('0')}})" 2>/dev/null || echo "0")

if [ "${BAL:-0}" -lt 200000000 ]; then
  echo ""
  echo "Need ~0.2 SUI for upgrade. Top up at:"
  echo "  https://faucet.sui.io/?address=$ADDR"
  echo "Then re-run: bash scripts/upgrade-testnet.sh"
  exit 1
fi

cd "$(dirname "$0")/../move/roundvault"
sui move build
sui client upgrade --upgrade-capability "$UPGRADE_CAP" --gas-budget 200000000

echo ""
echo "Upgrade done. Restart frontend dev server to pick up join_and_contribute_rep_entry."
