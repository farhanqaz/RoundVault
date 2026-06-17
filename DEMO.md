# RoundVault — 5-Minute Demo Script

Record **slash path first** (hardest). Keep a backup recording from Day 2.

Use vaults on package `0xbe23…` (with reputation). See [CHECKPOINT.md](./CHECKPOINT.md).

---

## 0:00–0:20 — Hook (no slides)

> "Every culture has rotating savings — arisan, tontines, chamas. Two things kill them: the organizer runs with the money, or someone gets their payout and stops paying. RoundVault fixes both on Sui."

---

## 0:20–0:40 — Problem

Show landing page. Point at stats bar (live from chain) and **Portable reputation** section.

> "$1 trillion informal savings. All trust-based. We put the pot in a smart contract — and your track record follows your wallet."

---

## 0:40–1:30 — Create vault

`/create` → Load demo preset → Create vault → land on vault dashboard.

Explain quickly:
- **Contribution** = per-round payment into pot
- **Stake bond** = collateral slashed on default

---

## 1:30–2:30 — Happy path

With 5 test wallets (or explain multi-wallet):

1. Join & stake (show forming → member count, reputation badge)
2. Activate vault
3. Contribute (show progress bar)
4. Distribute → click explorer link → show tx

> "Pot never touched a human wallet. Atomic on-chain."

---

## 2:30–3:30 — Slash path (MUST SHOW)

New round or new vault where 1 member doesn't pay.

1. Wait for deadline OR use 1-hour demo interval
2. Slash defaulter → show success + explorer tx
3. Point at "Total slashed" on dashboard + defaulter reputation drop

> "This is what Excel can't do. Defaults have consequences."

---

## 3:30–4:00 — Reputation

Header → **Reputation** or `/reputation/[your-address]`

> "Score is portable — join, contribute, payout, and slash update one on-chain profile across every RoundVault."

---

## 4:00–4:30 — Explore + contract

`/explore` → public vault list

Header → Contract link → Suiscan package

---

## 4:30–5:00 — Why Sui + close

> "Shared objects for vault state. PTBs for atomic rounds. Portable reputation. RoundVault — trustless rotating savings."

---

## Backup plan

If live demo fails: *"Here's a recorded walkthrough with on-chain proof"* → play backup clip → show explorer txs.

## Recording tips

- 1080p, dark mode, hide browser bookmarks
- Wallet network = **Sui Testnet**
- Pin tabs: app, suiscan, CHECKPOINT.md
