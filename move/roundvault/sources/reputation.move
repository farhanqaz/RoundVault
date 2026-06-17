/// Portable on-chain reputation for RoundVault participants.
/// Tracks vault activity across all vaults in a single shared registry.
module roundvault::reputation;

use roundvault::vault::{Self, Vault};
use sui::clock::Clock;
use sui::coin::{Self, Coin};
use sui::event;
use sui::random::Random;
use sui::sui::SUI;
use sui::table::{Self, Table};
use std::option;

// ─── Score weights ─────────────────────────────────────────────────────────────

const WEIGHT_JOIN: u64 = 5;
const WEIGHT_COMPLETE: u64 = 100;
const WEIGHT_CONTRIBUTION: u64 = 10;
const WEIGHT_PAYOUT: u64 = 30;
const PENALTY_SLASH: u64 = 200;

// ─── Objects ───────────────────────────────────────────────────────────────────

/// Global registry — one profile per address, portable across vaults.
public struct ReputationRegistry has key {
    id: UID,
    profiles: Table<address, ReputationProfile>,
}

/// On-chain reputation record for a single address.
public struct ReputationProfile has store, copy, drop {
    vaults_joined: u64,
    vaults_completed: u64,
    contributions: u64,
    total_contributed: u64,
    payouts_received: u64,
    total_payout_amount: u64,
    slashes: u64,
    score: u64,
}

// ─── Events ──────────────────────────────────────────────────────────────────

public struct ReputationUpdated has copy, drop {
    member: address,
    score: u64,
    vaults_joined: u64,
    vaults_completed: u64,
    contributions: u64,
    payouts_received: u64,
    slashes: u64,
}

// ─── Init ──────────────────────────────────────────────────────────────────────

fun init(ctx: &mut TxContext) {
    let registry = ReputationRegistry {
        id: object::new(ctx),
        profiles: table::new(ctx),
    };
    transfer::share_object(registry);
}

/// One-time setup after upgrade — creates and shares the global reputation registry.
entry fun create_registry_entry(ctx: &mut TxContext) {
    let registry = ReputationRegistry {
        id: object::new(ctx),
        profiles: table::new(ctx),
    };
    transfer::share_object(registry);
}

// ─── Reputation-aware vault entry points (new module — upgrade-safe) ─────────────

entry fun join_vault_rep_entry(
    vault: &mut Vault,
    stake: Coin<SUI>,
    registry: &mut ReputationRegistry,
    ctx: &mut TxContext,
) {
    let sender = ctx.sender();
    vault::join_vault(vault, stake, ctx);
    on_join(registry, sender);
}

/// Join + stake; when vault fills, auto-activate and pay round 1 contribution.
entry fun join_and_contribute_rep_entry(
    vault: &mut Vault,
    stake: Coin<SUI>,
    payment: Coin<SUI>,
    registry: &mut ReputationRegistry,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let sender = ctx.sender();
    let status_before = vault::vault_status(vault);
    vault::join_vault_with_clock(vault, stake, clock, ctx);
    on_join(registry, sender);

    if (status_before == 0 && vault::vault_status(vault) == 1) {
        let amount = coin::value(&payment);
        vault::contribute(vault, payment, ctx);
        on_contribute(registry, sender, amount);
    } else {
        transfer::public_transfer(payment, sender);
    };
}

entry fun contribute_rep_entry(
    vault: &mut Vault,
    payment: Coin<SUI>,
    _random: &Random,
    _clock: &Clock,
    registry: &mut ReputationRegistry,
    ctx: &mut TxContext,
) {
    let sender = ctx.sender();
    let amount = coin::value(&payment);
    vault::contribute(vault, payment, ctx);
    on_contribute(registry, sender, amount);
}

entry fun settle_round_rep_entry(
    vault: &mut Vault,
    random: &Random,
    clock: &Clock,
    registry: &mut ReputationRegistry,
    ctx: &mut TxContext,
) {
    apply_settlement(vault, random, clock, registry, ctx);
}

entry fun distribute_rep_entry(
    vault: &mut Vault,
    random: &Random,
    clock: &Clock,
    registry: &mut ReputationRegistry,
    ctx: &mut TxContext,
) {
    let amount = vault::pot_balance(vault);
    let recipient = vault::distribute(vault, random, clock, ctx);
    on_payout(registry, recipient, amount);
}

entry fun slash_defaulter_rep_entry(
    vault: &mut Vault,
    defaulter: address,
    clock: &Clock,
    registry: &mut ReputationRegistry,
    ctx: &mut TxContext,
) {
    vault::slash_defaulter(vault, defaulter, clock, ctx);
    on_slash(registry, defaulter);
}

entry fun withdraw_stake_rep_entry(
    vault: &mut Vault,
    registry: &mut ReputationRegistry,
    ctx: &mut TxContext,
) {
    let sender = ctx.sender();
    vault::withdraw_stake(vault, ctx);
    on_vault_completed(registry, sender);
}

// ─── Package hooks ───────────────────────────────────────────────────────────────

public(package) fun on_join(registry: &mut ReputationRegistry, member: address) {
    let profile = borrow_or_create(registry, member);
    profile.vaults_joined = profile.vaults_joined + 1;
    profile.score = profile.score + WEIGHT_JOIN;
    emit_update(member, profile);
}

public(package) fun on_contribute(
    registry: &mut ReputationRegistry,
    member: address,
    amount: u64,
) {
    let profile = borrow_or_create(registry, member);
    profile.contributions = profile.contributions + 1;
    profile.total_contributed = profile.total_contributed + amount;
    profile.score = profile.score + WEIGHT_CONTRIBUTION;
    emit_update(member, profile);
}

public(package) fun on_payout(
    registry: &mut ReputationRegistry,
    member: address,
    amount: u64,
) {
    let profile = borrow_or_create(registry, member);
    profile.payouts_received = profile.payouts_received + 1;
    profile.total_payout_amount = profile.total_payout_amount + amount;
    profile.score = profile.score + WEIGHT_PAYOUT;
    emit_update(member, profile);
}

public(package) fun on_vault_completed(registry: &mut ReputationRegistry, member: address) {
    let profile = borrow_or_create(registry, member);
    profile.vaults_completed = profile.vaults_completed + 1;
    profile.score = profile.score + WEIGHT_COMPLETE;
    emit_update(member, profile);
}

public(package) fun on_slash(registry: &mut ReputationRegistry, member: address) {
    let profile = borrow_or_create(registry, member);
    profile.slashes = profile.slashes + 1;
    if (profile.score >= PENALTY_SLASH) {
        profile.score = profile.score - PENALTY_SLASH;
    } else {
        profile.score = 0;
    };
    emit_update(member, profile);
}

// ─── View ──────────────────────────────────────────────────────────────────────

public fun get_profile(registry: &ReputationRegistry, addr: address): ReputationProfile {
    if (table::contains(&registry.profiles, addr)) {
        *table::borrow(&registry.profiles, addr)
    } else {
        empty_profile()
    }
}

public fun score(registry: &ReputationRegistry, addr: address): u64 {
    get_profile(registry, addr).score
}

public fun has_profile(registry: &ReputationRegistry, addr: address): bool {
    table::contains(&registry.profiles, addr)
}

public fun profile_count(registry: &ReputationRegistry): u64 {
    table::length(&registry.profiles)
}

public fun profile_vaults_joined(profile: &ReputationProfile): u64 {
    profile.vaults_joined
}

public fun profile_vaults_completed(profile: &ReputationProfile): u64 {
    profile.vaults_completed
}

public fun profile_contributions(profile: &ReputationProfile): u64 {
    profile.contributions
}

public fun profile_total_contributed(profile: &ReputationProfile): u64 {
    profile.total_contributed
}

public fun profile_payouts_received(profile: &ReputationProfile): u64 {
    profile.payouts_received
}

public fun profile_total_payout_amount(profile: &ReputationProfile): u64 {
    profile.total_payout_amount
}

public fun profile_slashes(profile: &ReputationProfile): u64 {
    profile.slashes
}

public fun profile_score(profile: &ReputationProfile): u64 {
    profile.score
}

// ─── Internal ──────────────────────────────────────────────────────────────────

fun apply_settlement(
    vault: &mut Vault,
    random: &Random,
    clock: &Clock,
    registry: &mut ReputationRegistry,
    ctx: &mut TxContext,
) {
    let result = vault::settle_round(vault, random, clock, ctx);
    let slashed = vault::settlement_slashed(&result);
    let mut i = 0;
    while (i < vector::length(&slashed)) {
        on_slash(registry, *vector::borrow(&slashed, i));
        i = i + 1;
    };

    let recipient = vault::settlement_recipient(&result);
    if (option::is_some(&recipient)) {
        on_payout(
            registry,
            *option::borrow(&recipient),
            vault::settlement_payout_amount(&result),
        );
    };
}

fun empty_profile(): ReputationProfile {
    ReputationProfile {
        vaults_joined: 0,
        vaults_completed: 0,
        contributions: 0,
        total_contributed: 0,
        payouts_received: 0,
        total_payout_amount: 0,
        slashes: 0,
        score: 0,
    }
}

fun borrow_or_create(registry: &mut ReputationRegistry, member: address): &mut ReputationProfile {
    if (!table::contains(&registry.profiles, member)) {
        table::add(&mut registry.profiles, member, empty_profile());
    };
    table::borrow_mut(&mut registry.profiles, member)
}

fun emit_update(member: address, profile: &ReputationProfile) {
    event::emit(ReputationUpdated {
        member,
        score: profile.score,
        vaults_joined: profile.vaults_joined,
        vaults_completed: profile.vaults_completed,
        contributions: profile.contributions,
        payouts_received: profile.payouts_received,
        slashes: profile.slashes,
    });
}

#[test_only]
public fun create_for_testing(ctx: &mut TxContext): ReputationRegistry {
    ReputationRegistry {
        id: object::new(ctx),
        profiles: table::new(ctx),
    }
}

#[test_only]
public fun share_for_testing(registry: ReputationRegistry) {
    transfer::share_object(registry);
}
