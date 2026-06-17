# RoundVault

**Trustless rotating savings on Sui.**

RoundVault brings ROSCA (Rotating Savings and Credit Association) on-chain. Members stake collateral, contribute each round, and one random member receives the pot — enforced by smart contract, not trust.

---

## Features

- **Non-custodial pot** — funds live in a shared on-chain vault object
- **Stake bonds** — defaulters are slashed after missing a round
- **Fair gacha** — random winner selection excludes members already paid
- **Portable reputation** — wallet score persists across vaults
- **Auto-activation** — vault starts when the last member joins and contributes

---

## Repository structure

```
move/roundvault/     Move smart contracts (vault + reputation)
frontend/            Next.js app (@mysten/dapp-kit)
deployments/         On-chain deployment manifests (public object IDs)
scripts/             E2E tests, env sync, upgrade helpers
```

---

## Testnet deployment

Canonical deployment metadata lives in [`deployments/testnet.json`](deployments/testnet.json).

| Field | Source |
|-------|--------|
| Package ID | `deployments/testnet.json` → `packageId` |
| Published at | `deployments/testnet.json` → `packagePublishedAt` |
| Reputation registry | `deployments/testnet.json` → `reputationRegistryId` |
| Upgrade capability | `deployments/testnet.json` → `upgradeCapability` |
| Publish transaction | [Suiscan](https://suiscan.xyz/testnet/tx/) + `publishTxDigest` |

Package upgrade metadata for the Sui CLI is tracked separately in `move/roundvault/Published.toml`.

---

## Quick start

### Prerequisites

- [Sui CLI](https://docs.sui.io/guides/developer/getting-started/sui-install) (for contract work)
- Node.js 20+

### Smart contract tests

```bash
cd move/roundvault
sui move test
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # template only — fill from deployments/testnet.json
npm run dev                  # http://localhost:3000
```

From the repo root you can auto-generate `.env.local`:

```bash
npm run sync:env
```

### Environment variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_PACKAGE_ID` | Original package ID (events, object types) |
| `NEXT_PUBLIC_PACKAGE_PUBLISHED_AT` | Latest published package ID (moveCall targets) |
| `NEXT_PUBLIC_REPUTATION_REGISTRY_ID` | Shared `ReputationRegistry` object ID |
| `NEXT_PUBLIC_SITE_URL` | Public site URL for OpenGraph metadata (optional) |

**Do not commit `.env.local`.** Use `deployments/testnet.json` as the single source of truth and copy values into your local env or hosting provider.

### Deploy frontend (Vercel)

- Root directory: `frontend`
- Set the three `NEXT_PUBLIC_*` contract variables from `deployments/testnet.json`
- Set `NEXT_PUBLIC_SITE_URL` to your production URL

---

## Contract API

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

**Reputation (`reputation` module)**

| Entry function | Description |
|----------------|-------------|
| `join_vault_rep_entry` | Join + reputation +5 |
| `join_and_contribute_rep_entry` | Join last slot with stake + first contribution |
| `contribute_rep_entry` | Contribute for current round |
| `settle_round_rep_entry` | Auto slash + gacha after deadline |
| `withdraw_stake_rep_entry` | Withdraw stake + vault complete +100 |

### Events

`VaultCreated` · `MemberJoined` · `VaultActivated` · `Contributed` · `Distributed` · `Slashed` · `StakeWithdrawn` · `ReputationUpdated`

---

## Testing

```bash
npm test                 # Move unit tests + testnet E2E smoke
npm run test:e2e:write   # E2E + create_vault tx (needs funded sui CLI wallet)
```

---

## Upgrading the package

```bash
bash scripts/upgrade-testnet.sh
```

After upgrading, update `deployments/testnet.json` if `packagePublishedAt` changes, then run `npm run sync:env`.

---

## License

MIT
