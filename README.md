# RoundVault

**Trustless rotating savings on Sui.**

> *No custodian holds the pot. Defaults get slashed.*

RoundVault brings ROSCA (Rotating Savings and Credit Association) on-chain. Members stake collateral, contribute each round, and one random member wins the pot each round — enforced by smart contract, not trust.

**Status:** see **[CHECKPOINT.md](./CHECKPOINT.md)** for what is shipped vs remaining hackathon tasks.

---

## Problem

Over **$1 trillion** flows through informal rotating savings clubs every year. Two failure modes:

| Failure | Informal | RoundVault |
|---------|----------|------------|
| Custodian runs with pot | Common | Impossible — pot in shared object |
| Member defaults after payout | Very common | Stake bond slashed on-chain |

---

## Live deployment (Sui Testnet)

| Resource | Link |
|----------|------|
| **Package ID** | `0x7a368a14a9fd91a364c41ad9db905a1179e808930f51889dca61d1c073cad444` (v2) |
| **Publish tx** | [Suiscan ↗](https://suiscan.xyz/testnet/tx/Dauug2vmjMtjUXxwySAT9yCnjK5ByZAepF5m7cC7MkFQ) |
| **Upgrade tx (v2)** | [Suiscan ↗](https://suiscan.xyz/testnet/tx/EJ5JbTtsv6i1cbk3PaDNLZKGUExuvW6zfnVZwYdBrEZs) |
| **ReputationRegistry** | `0x75fdf641343ce8aa1d89ab3f893f8697ae64b395e10ff6c4effc9a026981fa7a` |
| **Modules** | `vault`, `reputation` |

---

## Quick start

### Contract tests

```bash
cd move/roundvault
sui move test
```

### Frontend (Next.js)

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev                  # http://localhost:3000
```

Env vars:

```
NEXT_PUBLIC_PACKAGE_ID=0x7a368a14a9fd91a364c41ad9db905a1179e808930f51889dca61d1c073cad444
NEXT_PUBLIC_REPUTATION_REGISTRY_ID=0x75fdf641343ce8aa1d89ab3f893f8697ae64b395e10ff6c4effc9a026981fa7a
```

### Deploy frontend (Vercel)

Root directory: `frontend` · Env: both vars above.

---

## Architecture

```
move/roundvault/sources/
  vault.move        On-chain ROSCA protocol
  reputation.move   Portable score registry + rep-aware entry points
frontend/           Next.js + @mysten/dapp-kit
```

### Contract API

**Vault (`vault` module)**

| Entry function | Description |
|----------------|-------------|
| `create_vault_entry` | Create shared vault + AdminCap |
| `join_vault_entry` | Join with stake bond |
| `activate_vault_entry` | Start rounds when full |
| `contribute_entry` | Pay round contribution → pot |
| `settle_round_entry` | Auto slash defaulters + gacha draw |
| `distribute_entry` | Manual gacha (legacy) |
| `slash_defaulter_entry` | Manual slash one member (legacy) |
| `withdraw_stake_entry` | Reclaim stake after completion |

**Reputation (`reputation` module)** — updates global score; use from frontend:

| Entry function | Description |
|----------------|-------------|
| `join_vault_rep_entry` | Join + reputation +5 |
| `contribute_rep_entry` | Contribute + auto gacha when all paid |
| `settle_round_rep_entry` | Auto slash + gacha after deadline |
| `withdraw_stake_rep_entry` | Withdraw stake + vault complete +100 |

### Events

`VaultCreated` · `MemberJoined` · `VaultActivated` · `Contributed` · `Distributed` · `Slashed` · `StakeWithdrawn` · `ReputationUpdated`

---

## Hackathon materials

- **[CHECKPOINT.md](./CHECKPOINT.md)** — shipped / cancelled / remaining
- **[SUBMISSION.md](./SUBMISSION.md)** — Devfolio copy, judging alignment
- **[DEMO.md](./DEMO.md)** — 5-minute video script

---

## vs Existing projects

| | RoundVault | Arischain | TrustArisan | CROSCA |
|--|------------|-----------|-------------|--------|
| Chain | **Sui** | Ethereum | BSC | EVM |
| Stake + slash | ✓ | Basic | ? | ✓ |
| Portable reputation | ✓ | — | — | — |
| Sui PTBs | ✓ | — | — | — |

---

## Out of scope (cancelled)

Not planned for this hackathon: zkLogin, gas sponsorship, slot NFT early exit, idle yield on pooled funds. Details in [CHECKPOINT.md](./CHECKPOINT.md).

---

## Track

Sui Overflow 2026 — **DeFi & Payments**

## License

MIT
