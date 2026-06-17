# RoundVault — Checkpoint (Jun 2026)

**Sui Overflow 2026 · DeFi & Payments**

Trustless rotating savings (ROSCA) on Sui — stake bonds, round contributions, atomic distribution, slash on default, plus portable on-chain reputation.

---

## Live on testnet

| Resource | Value |
|----------|--------|
| **Package ID** | `0x7a368a14a9fd91a364c41ad9db905a1179e808930f51889dca61d1c073cad444` |
| **Package version** | v2 (auto-settle upgrade) |
| **Publish tx** | [Dauug2vmjMtjUXxwySAT9yCnjK5ByZAepF5m7cC7MkFQ](https://suiscan.xyz/testnet/tx/Dauug2vmjMtjUXxwySAT9yCnjK5ByZAepF5m7cC7MkFQ) |
| **Upgrade tx (v2)** | [EJ5JbTtsv6i1cbk3PaDNLZKGUExuvW6zfnVZwYdBrEZs](https://suiscan.xyz/testnet/tx/EJ5JbTtsv6i1cbk3PaDNLZKGUExuvW6zfnVZwYdBrEZs) |
| **Modules** | `vault`, `reputation` |
| **ReputationRegistry** | `0x75fdf641343ce8aa1d89ab3f893f8697ae64b395e10ff6c4effc9a026981fa7a` |

> **Gacha payouts:** each round picks a random eligible member via Sui `Random`. No fixed payout order at create time.
>
> **Auto-settle (v2):** gacha runs automatically when all members pay; after deadline, unpaid members are slashed automatically then gacha draws — no manual buttons.

---

## Shipped

### Move contract (`move/roundvault/`)

| Feature | Status |
|---------|--------|
| Vault lifecycle (Forming → Collecting → Completed) | ✓ |
| Create, join, activate, contribute | ✓ |
| **Auto gacha** on last contribution (`settle_round`) | ✓ |
| **Auto slash all defaulters** + gacha after deadline | ✓ |
| Withdraw stake after completion | ✓ |
| Events for indexing (`VaultCreated`, `Contributed`, `Slashed`, …) | ✓ |
| **Portable reputation** (`reputation.move`) | ✓ |
| Reputation-aware entry points (`*_rep_entry`) | ✓ |
| Unit tests (5 passing) | ✓ |

**Reputation scoring:** join +5 · contribute +10 · payout +30 · complete +100 · slash −200

### Frontend (`frontend/`)

| Route | Status |
|-------|--------|
| `/` | Landing + live stats + reputation section |
| `/create` | Create vault + demo preset |
| `/explore` | Public vault feed from events |
| `/vault/[id]` | Dashboard, actions, member rep badges |
| `/reputation/[address]` | On-chain profile |

| Integration | Status |
|-------------|--------|
| Sui Wallet via `@mysten/dapp-kit` | ✓ |
| All vault txs use `*_rep_entry` + registry | ✓ |
| Auto-settle on deadline (frontend keeper) | ✓ |
| `npm run build` | ✓ |

### Docs

| File | Purpose |
|------|---------|
| `README.md` | Setup + architecture |
| `SUBMISSION.md` | Devfolio / judging copy |
| `DEMO.md` | 5-minute video script |
| `CHECKPOINT.md` | This file |

---

## Not done (hackathon gaps)

| Item | Priority |
|------|----------|
| Demo video recorded | High |
| Vercel / public deploy URL | High |
| End-to-end test on new package | ✅ (`npm run test:e2e` + `test:e2e:write`) |
| GitHub public + Devfolio link | ✅ [github.com/farhanqaz/RoundVault](https://github.com/farhanqaz/RoundVault) |

---

## Cancelled — out of scope

These were explored or listed on early roadmaps but **will not be built** for this submission:

| Feature | Reason |
|---------|--------|
| **zkLogin** (Google sign-in) | Removed to reduce complexity; standard Sui Wallet only |
| **Gas sponsorship / Enoki** | Removed with zkLogin; users pay testnet gas |
| **Slot NFT early exit** | Not core to ROSCA MVP |
| **Idle yield on pooled funds** | Regulatory + scope; pot stays idle by design |

No scaffold remains in the frontend for Enoki, zkLogin, `/auth`, or sponsor API routes.

---

## Quick commands

```bash
# Contract tests
cd move/roundvault && sui move test

# E2E testnet validation (read-only)
npm run test:e2e

# E2E + write tx (needs funded sui CLI wallet on testnet)
npm run test:e2e:write

# All tests
npm test

# Frontend
cd frontend && cp .env.example .env.local && npm install && npm run dev
```

**Env vars:**

```
NEXT_PUBLIC_PACKAGE_ID=0x7a368a14a9fd91a364c41ad9db905a1179e808930f51889dca61d1c073cad444
NEXT_PUBLIC_REPUTATION_REGISTRY_ID=0x75fdf641343ce8aa1d89ab3f893f8697ae64b395e10ff6c4effc9a026981fa7a
```

---

## Demo flow (recommended)

1. Create vault → join → activate
2. All contribute → **gacha auto-runs** on last payment
3. **Slash path** — skip one member → wait deadline → **auto-settle** (slash + gacha)
4. Show **reputation** score in header + `/reputation/[address]`
5. `/explore` + Suiscan contract link

See [DEMO.md](./DEMO.md) for full script.
