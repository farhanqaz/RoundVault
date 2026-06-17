# RoundVault

**Trustless rotating savings on Sui.**

> *No custodian holds the pot. Defaults get slashed.*

RoundVault brings ROSCA (Rotating Savings and Credit Association) on-chain. Members stake collateral, contribute each round, and one random member wins the pot each round — enforced by smart contract, not trust.

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
| **Package ID** | `0x346ec1fa6b3c0e476c60b20e8700486e7d64084925492cd3bd06c4dbd769ce86` (v1) |
| **Publish tx** | [Suiscan ↗](https://suiscan.xyz/testnet/tx/F5LeZHurn19ajXcyPhzRszg69Kk563y3VNMWtKirEyZo) |
| **ReputationRegistry** | `0x35d004d3e02124f7b077d9b1781218d0510cc22253b58bd6e3c3709af13d9b5e` |
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
NEXT_PUBLIC_PACKAGE_ID=0x346ec1fa6b3c0e476c60b20e8700486e7d64084925492cd3bd06c4dbd769ce86
NEXT_PUBLIC_PACKAGE_PUBLISHED_AT=0x346ec1fa6b3c0e476c60b20e8700486e7d64084925492cd3bd06c4dbd769ce86
NEXT_PUBLIC_REPUTATION_REGISTRY_ID=0x35d004d3e02124f7b077d9b1781218d0510cc22253b58bd6e3c3709af13d9b5e
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

## Tests

```bash
npm test              # Move unit tests + testnet E2E smoke
npm run test:e2e:write  # E2E + create_vault tx (needs funded sui CLI wallet)
```

---

## License

MIT
