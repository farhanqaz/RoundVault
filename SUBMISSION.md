# RoundVault — Sui Overflow 2026 Submission

## One-liner

**Trustless rotating savings on Sui — no custodian holds the pot, defaults get slashed, reputation follows your wallet.**

## Devfolio description (copy-paste)

I grew up around informal rotating savings groups. I've seen circles collapse when someone ghosts after receiving their payout. RoundVault puts the pot on-chain — the organizer never custodies funds, and members who default lose their stake bond. A portable reputation score tracks joins, contributions, payouts, and slashes across every vault. Connect any Sui wallet on testnet to create or join a vault.

## Track

**DeFi & Payments** (primary)

## Problem (50% judging axis)

$1T+ flows through ROSCAs (rotating savings clubs) annually across Southeast Asia, Africa, and Latin America — arisan, tontines, susu, chama. Two failure modes:

1. **Custodian runs** — organizer holds the pot off-chain
2. **Member defaults** — recipient stops contributing; social enforcement fails

Excel and group chats cannot slash collateral. Blockchains can.

## Solution

RoundVault is a Move protocol on Sui:

- **Shared Vault object** — pot locked in contract, never a human wallet
- **Stake bond** — collateral on join; slashed if member misses round deadline
- **Round contributions** — fixed payments into pot each interval
- **Atomic distribution** — full pot to round recipient in one PTB
- **On-chain events** — public audit trail for every vault, contribution, slash
- **Portable reputation** — global `ReputationRegistry`; score travels with wallet across vaults

## Why Sui

| Primitive | Use |
|-----------|-----|
| Shared objects | Vault state visible to all members |
| PTBs | Contribute + distribute atomically |
| Fast finality | Round settlement feels instant |

## Live on testnet

| | |
|--|--|
| Package | `0x7a368a14a9fd91a364c41ad9db905a1179e808930f51889dca61d1c073cad444` (v2) |
| Publish tx | [suiscan](https://suiscan.xyz/testnet/tx/Dauug2vmjMtjUXxwySAT9yCnjK5ByZAepF5m7cC7MkFQ) |
| Upgrade tx | [suiscan](https://suiscan.xyz/testnet/tx/EJ5JbTtsv6i1cbk3PaDNLZKGUExuvW6zfnVZwYdBrEZs) |
| ReputationRegistry | `0x75fdf641343ce8aa1d89ab3f893f8697ae64b395e10ff6c4effc9a026981fa7a` |
| App | `npm run dev` in `/frontend` (see [CHECKPOINT.md](./CHECKPOINT.md)) |

## vs Competitors

| | RoundVault | Arischain (ETH) | Informal |
|--|------------|-----------------|----------|
| Chain | Sui | Ethereum | — |
| Stake slash | ✓ | Partial | ✗ |
| Portable reputation | ✓ | ✗ | ✗ |
| First on Sui ROSCA | ✓ | — | — |
| Wallet onboarding | Sui Wallet | MetaMask only | WhatsApp |

## Demo checklist

- [ ] Create vault (5 members, 0.1 SUI contribution + stake)
- [ ] 5 wallets join & stake (reputation +5 each)
- [ ] Activate vault
- [ ] All contribute → **gacha auto-runs** on last payment
- [ ] **Slash path**: 1 member skips → deadline passes → **auto-settle** (slash + gacha)
- [ ] Show `/reputation/[address]` — score updates on-chain
- [ ] Show `/explore` public vault feed

## Team angle

Built by someone who understands rotating savings culturally — not a DEX clone, not a trader tool. A financial primitive for the next billion users.

## Scope note

**Cancelled for this submission:** zkLogin, gas sponsorship, slot NFT early exit, idle yield. Full status in [CHECKPOINT.md](./CHECKPOINT.md).
