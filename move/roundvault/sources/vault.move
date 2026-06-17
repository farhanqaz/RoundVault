/// RoundVault — trustless rotating savings on Sui.
/// Members stake collateral, contribute each round, and one random member wins the pot (gacha).
/// Miss a payment after the deadline → stake is slashed and members are compensated.
module roundvault::vault;

use std::option::{Self, Option};
use sui::balance::{Self, Balance};
use sui::clock::{Self, Clock};
use sui::coin::{Self, Coin};
use sui::event;
use sui::random::{Self, Random};
use sui::sui::SUI;

// ─── Status ───────────────────────────────────────────────────────────────────

const STATUS_FORMING: u8 = 0;
const STATUS_COLLECTING: u8 = 1;
const STATUS_COMPLETED: u8 = 2;

// ─── Errors ─────────────────────────────────────────────────────────────────

const E_NOT_ADMIN: u64 = 1;
const E_VAULT_NOT_FORMING: u64 = 2;
const E_VAULT_FULL: u64 = 3;
const E_ALREADY_MEMBER: u64 = 4;
const E_NOT_MEMBER: u64 = 5;
const E_INSUFFICIENT_STAKE: u64 = 6;
const E_VAULT_NOT_COLLECTING: u64 = 7;
const E_INSUFFICIENT_CONTRIBUTION: u64 = 8;
const E_ALREADY_CONTRIBUTED: u64 = 9;
const E_NOT_ALL_CONTRIBUTED: u64 = 10;
const E_DEADLINE_NOT_PASSED: u64 = 11;
const E_MEMBER_ALREADY_PAID: u64 = 12;
const E_VAULT_NOT_COMPLETE: u64 = 13;
const E_STAKE_NOT_RETURNED: u64 = 14;
const E_INVALID_CONFIG: u64 = 15;
const E_VAULT_NOT_READY: u64 = 16;
const E_NO_ELIGIBLE_RECIPIENT: u64 = 17;
const E_ROUND_NOT_READY: u64 = 18;

// ─── Objects ──────────────────────────────────────────────────────────────────

/// Shared vault — the pot never touches a human wallet.
public struct Vault has key {
    id: UID,
    name: vector<u8>,
    admin: address,
    members: vector<Member>,
    max_members: u64,
    contribution: u64,
    stake_amount: u64,
    total_rounds: u8,
    current_round: u8,
    interval_ms: u64,
    round_deadline_ms: u64,
    /// Winners revealed each round after on-chain gacha draw.
    payout_history: vector<address>,
    pot: Balance<SUI>,
    stake_pool: Balance<SUI>,
    treasury: Balance<SUI>,
    status: u8,
    total_slashed: u64,
}

public struct Member has store {
    addr: address,
    staked: bool,
    paid_current_round: bool,
    received_payout: bool,
    miss_count: u8,
    stake_withdrawn: bool,
}

public struct AdminCap has key, store {
    id: UID,
    vault_id: ID,
}

// ─── Events ───────────────────────────────────────────────────────────────────

public struct VaultCreated has copy, drop {
    vault_id: ID,
    name: vector<u8>,
    max_members: u64,
    contribution: u64,
    gacha_mode: bool,
}

public struct MemberJoined has copy, drop {
    vault_id: ID,
    member: address,
    member_count: u64,
}

public struct VaultActivated has copy, drop {
    vault_id: ID,
    member_count: u64,
    total_rounds: u8,
}

public struct Contributed has copy, drop {
    vault_id: ID,
    member: address,
    round: u8,
    amount: u64,
}

public struct Distributed has copy, drop {
    vault_id: ID,
    round: u8,
    recipient: address,
    amount: u64,
    eligible_count: u64,
}

public struct Slashed has copy, drop {
    vault_id: ID,
    defaulter: address,
    amount: u64,
    round: u8,
}

public struct StakeWithdrawn has copy, drop {
    vault_id: ID,
    member: address,
    amount: u64,
}

/// Result of automatic round settlement (slash defaulters + gacha draw).
public struct SettlementResult has drop {
    recipient: Option<address>,
    slashed_members: vector<address>,
    payout_amount: u64,
}

// ─── Create ───────────────────────────────────────────────────────────────────

/// Create a gacha vault. Each round one random eligible member wins the pot.
public fun create_vault(
    name: vector<u8>,
    max_members: u64,
    contribution: u64,
    stake_amount: u64,
    total_rounds: u8,
    interval_ms: u64,
    ctx: &mut TxContext,
): AdminCap {
    assert!(max_members > 0, E_INVALID_CONFIG);
    assert!(total_rounds == max_members as u8, E_INVALID_CONFIG);

    let vault_id = object::new(ctx);
    let vault_id_copy = object::uid_to_inner(&vault_id);

    let vault = Vault {
        id: vault_id,
        name,
        admin: ctx.sender(),
        members: vector[],
        max_members,
        contribution,
        stake_amount,
        total_rounds,
        current_round: 0,
        interval_ms,
        round_deadline_ms: 0,
        payout_history: vector[],
        pot: balance::zero(),
        stake_pool: balance::zero(),
        treasury: balance::zero(),
        status: STATUS_FORMING,
        total_slashed: 0,
    };

    let cap = AdminCap {
        id: object::new(ctx),
        vault_id: vault_id_copy,
    };

    event::emit(VaultCreated {
        vault_id: vault_id_copy,
        name: vault.name,
        max_members,
        contribution,
        gacha_mode: true,
    });

    transfer::share_object(vault);
    cap
}

entry fun create_vault_entry(
    name: vector<u8>,
    max_members: u64,
    contribution: u64,
    stake_amount: u64,
    total_rounds: u8,
    interval_ms: u64,
    ctx: &mut TxContext,
) {
    let cap = create_vault(
        name,
        max_members,
        contribution,
        stake_amount,
        total_rounds,
        interval_ms,
        ctx,
    );
    transfer::public_transfer(cap, ctx.sender());
}

// ─── Join ─────────────────────────────────────────────────────────────────────

/// Join a forming vault by staking collateral.
public fun join_vault(vault: &mut Vault, stake: Coin<SUI>, ctx: &mut TxContext) {
    assert!(vault.status == STATUS_FORMING, E_VAULT_NOT_FORMING);
    assert!(vector::length(&vault.members) < vault.max_members, E_VAULT_FULL);

    let sender = ctx.sender();
    assert!(!is_member(vault, sender), E_ALREADY_MEMBER);
    assert!(coin::value(&stake) >= vault.stake_amount, E_INSUFFICIENT_STAKE);

    let stake_bal = coin::into_balance(stake);
    balance::join(&mut vault.stake_pool, stake_bal);

    vector::push_back(
        &mut vault.members,
        Member {
            addr: sender,
            staked: true,
            paid_current_round: false,
            received_payout: false,
            miss_count: 0,
            stake_withdrawn: false,
        },
    );

    event::emit(MemberJoined {
        vault_id: object::id(vault),
        member: sender,
        member_count: vector::length(&vault.members),
    });
}

entry fun join_vault_entry(vault: &mut Vault, stake: Coin<SUI>, ctx: &mut TxContext) {
    join_vault(vault, stake, ctx);
}

// ─── Activate ─────────────────────────────────────────────────────────────────

/// Start the vault once all members have joined.
public fun activate_vault(vault: &mut Vault, cap: &AdminCap, clock: &Clock, ctx: &mut TxContext) {
    assert!(ctx.sender() == vault.admin, E_NOT_ADMIN);
    assert!(object::id(vault) == cap.vault_id, E_NOT_ADMIN);
    assert!(vault.status == STATUS_FORMING, E_VAULT_NOT_FORMING);
    assert!(vector::length(&vault.members) == vault.max_members, E_VAULT_NOT_READY);

    vault.status = STATUS_COLLECTING;
    vault.current_round = 0;
    vault.round_deadline_ms = clock::timestamp_ms(clock) + vault.interval_ms;

    event::emit(VaultActivated {
        vault_id: object::id(vault),
        member_count: vault.max_members,
        total_rounds: vault.total_rounds,
    });
}

entry fun activate_vault_entry(
    vault: &mut Vault,
    cap: &AdminCap,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    activate_vault(vault, cap, clock, ctx);
}

// ─── Contribute ─────────────────────────────────────────────────────────────────

/// Pay this round's contribution into the pot.
public fun contribute(
    vault: &mut Vault,
    payment: Coin<SUI>,
    ctx: &mut TxContext,
) {
    assert!(vault.status == STATUS_COLLECTING, E_VAULT_NOT_COLLECTING);

    let sender = ctx.sender();
    let idx = member_index(vault, sender);
    assert!(idx < vector::length(&vault.members), E_NOT_MEMBER);

    let member = vector::borrow_mut(&mut vault.members, idx);
    assert!(!member.paid_current_round, E_ALREADY_CONTRIBUTED);
    assert!(coin::value(&payment) >= vault.contribution, E_INSUFFICIENT_CONTRIBUTION);

    let payment_bal = coin::into_balance(payment);
    balance::join(&mut vault.pot, payment_bal);
    member.paid_current_round = true;

    event::emit(Contributed {
        vault_id: object::id(vault),
        member: sender,
        round: vault.current_round,
        amount: vault.contribution,
    });
}

entry fun contribute_entry(vault: &mut Vault, payment: Coin<SUI>, ctx: &mut TxContext) {
    contribute(vault, payment, ctx);
}

// ─── Distribute (gacha) ─────────────────────────────────────────────────────────

/// Gacha draw: pick a random eligible member and send them the pot.
public fun distribute(
    vault: &mut Vault,
    random: &Random,
    clock: &Clock,
    ctx: &mut TxContext,
): address {
    assert!(vault.status == STATUS_COLLECTING, E_VAULT_NOT_COLLECTING);
    assert!(all_contributed(vault), E_NOT_ALL_CONTRIBUTED);

    let round = vault.current_round;
    let eligible_count = count_eligible_winners(vault);
    assert!(eligible_count > 0, E_NO_ELIGIBLE_RECIPIENT);

    let mut generator = random::new_generator(random, ctx);
    let recipient = pick_gacha_recipient(vault, &mut generator);
    let amount = balance::value(&vault.pot);

    let payout = balance::split(&mut vault.pot, amount);
    transfer::public_transfer(coin::from_balance(payout, ctx), recipient);

    mark_recipient_paid(vault, recipient);
    vector::push_back(&mut vault.payout_history, recipient);

    event::emit(Distributed {
        vault_id: object::id(vault),
        round,
        recipient,
        amount,
        eligible_count,
    });

    vault.current_round = round + 1;

    if (vault.current_round >= vault.total_rounds) {
        vault.status = STATUS_COMPLETED;
    } else {
        reset_round_payments(vault);
        vault.round_deadline_ms = clock::timestamp_ms(clock) + vault.interval_ms;
    };

    recipient
}

entry fun distribute_entry(
    vault: &mut Vault,
    random: &Random,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    distribute(vault, random, clock, ctx);
}

// ─── Settle round (auto slash + gacha) ──────────────────────────────────────────

/// End the current round: slash all unpaid members after deadline, then gacha draw.
/// Callable when all members paid OR the round deadline has passed.
public fun settle_round(
    vault: &mut Vault,
    random: &Random,
    clock: &Clock,
    ctx: &mut TxContext,
): SettlementResult {
    assert!(vault.status == STATUS_COLLECTING, E_VAULT_NOT_COLLECTING);

    let deadline_passed = clock::timestamp_ms(clock) >= vault.round_deadline_ms;
    let all_paid = all_contributed(vault);
    assert!(deadline_passed || all_paid, E_ROUND_NOT_READY);

    let mut slashed = vector[];

    if (deadline_passed && !all_paid) {
        slash_all_defaulters(vault, clock, ctx, &mut slashed);
    };

    assert!(all_contributed(vault), E_NOT_ALL_CONTRIBUTED);

    let pot = balance::value(&vault.pot);
    let eligible = count_eligible_winners(vault);

    if (pot > 0 && eligible > 0) {
        let amount = pot;
        let recipient = distribute(vault, random, clock, ctx);
        SettlementResult {
            recipient: option::some(recipient),
            slashed_members: slashed,
            payout_amount: amount,
        }
    } else {
        advance_round_without_payout(vault, clock);
        SettlementResult {
            recipient: option::none(),
            slashed_members: slashed,
            payout_amount: 0,
        }
    }
}

entry fun settle_round_entry(
    vault: &mut Vault,
    random: &Random,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    settle_round(vault, random, clock, ctx);
}

public fun can_settle(vault: &Vault, clock: &Clock): bool {
    if (vault.status != STATUS_COLLECTING) {
        return false
    };
    let deadline_passed = clock::timestamp_ms(clock) >= vault.round_deadline_ms;
    all_contributed(vault) || deadline_passed
}

public fun round_all_contributed(vault: &Vault): bool {
    all_contributed(vault)
}

public fun settlement_recipient(result: &SettlementResult): Option<address> {
    result.recipient
}

public fun settlement_slashed(result: &SettlementResult): vector<address> {
    result.slashed_members
}

public fun settlement_payout_amount(result: &SettlementResult): u64 {
    result.payout_amount
}

// ─── Slash ──────────────────────────────────────────────────────────────────────

/// Slash a member who missed the round deadline without contributing.
public fun slash_defaulter(
    vault: &mut Vault,
    defaulter: address,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(vault.status == STATUS_COLLECTING, E_VAULT_NOT_COLLECTING);
    assert!(clock::timestamp_ms(clock) >= vault.round_deadline_ms, E_DEADLINE_NOT_PASSED);

    let idx = member_index(vault, defaulter);
    assert!(idx < vector::length(&vault.members), E_NOT_MEMBER);

    let member = vector::borrow(&vault.members, idx);
    assert!(!member.paid_current_round, E_MEMBER_ALREADY_PAID);
    assert!(member.staked, E_STAKE_NOT_RETURNED);

    let slash_amount = vault.stake_amount;
    assert!(balance::value(&vault.stake_pool) >= slash_amount, E_INSUFFICIENT_STAKE);

    let mut slashed = balance::split(&mut vault.stake_pool, slash_amount);

    let paid_count = count_paid_members(vault);
    let to_members = balance::value(&slashed) / 2;
    let to_treasury = balance::value(&slashed) - to_members;

    if (paid_count > 0) {
        let per_member = to_members / paid_count;
        let mut i = 0;
        while (i < vector::length(&vault.members)) {
            let m = vector::borrow(&vault.members, i);
            if (m.paid_current_round) {
                let share = balance::split(&mut slashed, per_member);
                transfer::public_transfer(
                    coin::from_balance(share, ctx),
                    m.addr,
                );
            };
            i = i + 1;
        };
    } else {
        balance::join(&mut vault.treasury, balance::split(&mut slashed, to_members));
    };

    balance::join(&mut vault.treasury, balance::split(&mut slashed, to_treasury));
    balance::join(&mut vault.treasury, slashed);

    let member_mut = vector::borrow_mut(&mut vault.members, idx);
    member_mut.staked = false;
    member_mut.miss_count = member_mut.miss_count + 1;
    member_mut.paid_current_round = true;

    vault.total_slashed = vault.total_slashed + slash_amount;

    event::emit(Slashed {
        vault_id: object::id(vault),
        defaulter,
        amount: slash_amount,
        round: vault.current_round,
    });
}

entry fun slash_defaulter_entry(
    vault: &mut Vault,
    defaulter: address,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    slash_defaulter(vault, defaulter, clock, ctx);
}

// ─── Withdraw stake ─────────────────────────────────────────────────────────────

/// Withdraw remaining stake after the vault completes all rounds.
public fun withdraw_stake(vault: &mut Vault, ctx: &mut TxContext) {
    assert!(vault.status == STATUS_COMPLETED, E_VAULT_NOT_COMPLETE);

    let sender = ctx.sender();
    let idx = member_index(vault, sender);
    assert!(idx < vector::length(&vault.members), E_NOT_MEMBER);

    let member = vector::borrow_mut(&mut vault.members, idx);
    assert!(member.staked, E_STAKE_NOT_RETURNED);
    assert!(!member.stake_withdrawn, E_STAKE_NOT_RETURNED);

    member.stake_withdrawn = true;
    member.staked = false;

    let amount = vault.stake_amount;
    let stake = balance::split(&mut vault.stake_pool, amount);
    transfer::public_transfer(coin::from_balance(stake, ctx), sender);

    event::emit(StakeWithdrawn {
        vault_id: object::id(vault),
        member: sender,
        amount,
    });
}

entry fun withdraw_stake_entry(vault: &mut Vault, ctx: &mut TxContext) {
    withdraw_stake(vault, ctx);
}

// ─── View helpers ───────────────────────────────────────────────────────────────

public fun vault_status(vault: &Vault): u8 {
    vault.status
}

public fun current_round(vault: &Vault): u8 {
    vault.current_round
}

public fun member_count(vault: &Vault): u64 {
    vector::length(&vault.members)
}

public fun pot_balance(vault: &Vault): u64 {
    balance::value(&vault.pot)
}

public fun total_slashed(vault: &Vault): u64 {
    vault.total_slashed
}

public fun round_deadline_ms(vault: &Vault): u64 {
    vault.round_deadline_ms
}

/// Gacha: no fixed next recipient until distribute runs.
public fun eligible_winner_count(vault: &Vault): u64 {
    count_eligible_winners(vault)
}

public fun admin_cap_vault_id(cap: &AdminCap): ID {
    cap.vault_id
}

fun advance_round_without_payout(vault: &mut Vault, clock: &Clock) {
    vault.current_round = vault.current_round + 1;

    if (vault.current_round >= vault.total_rounds) {
        vault.status = STATUS_COMPLETED;
    } else {
        reset_round_payments(vault);
        vault.round_deadline_ms = clock::timestamp_ms(clock) + vault.interval_ms;
    };
}

fun slash_all_defaulters(
    vault: &mut Vault,
    clock: &Clock,
    ctx: &mut TxContext,
    slashed: &mut vector<address>,
) {
    assert!(clock::timestamp_ms(clock) >= vault.round_deadline_ms, E_DEADLINE_NOT_PASSED);

    let len = vector::length(&vault.members);
    let mut i = 0;
    while (i < len) {
        let addr = vector::borrow(&vault.members, i).addr;
        let should_slash = {
            let member = vector::borrow(&vault.members, i);
            !member.paid_current_round && member.staked
        };
        if (should_slash) {
            slash_defaulter(vault, addr, clock, ctx);
            vector::push_back(slashed, addr);
        };
        i = i + 1;
    };
}

// ─── Internal ───────────────────────────────────────────────────────────────────

fun is_member(vault: &Vault, addr: address): bool {
    let mut i = 0;
    while (i < vector::length(&vault.members)) {
        if (vector::borrow(&vault.members, i).addr == addr) {
            return true
        };
        i = i + 1;
    };
    false
}

fun member_index(vault: &Vault, addr: address): u64 {
    let mut i = 0;
    while (i < vector::length(&vault.members)) {
        if (vector::borrow(&vault.members, i).addr == addr) {
            return i
        };
        i = i + 1;
    };
    vector::length(&vault.members)
}

fun all_contributed(vault: &Vault): bool {
    let mut i = 0;
    while (i < vector::length(&vault.members)) {
        if (!vector::borrow(&vault.members, i).paid_current_round) {
            return false
        };
        i = i + 1;
    };
    true
}

fun count_paid_members(vault: &Vault): u64 {
    let mut count = 0;
    let mut i = 0;
    while (i < vector::length(&vault.members)) {
        if (vector::borrow(&vault.members, i).paid_current_round) {
            count = count + 1;
        };
        i = i + 1;
    };
    count
}

fun count_eligible_winners(vault: &Vault): u64 {
    let mut count = 0;
    let mut i = 0;
    while (i < vector::length(&vault.members)) {
        let member = vector::borrow(&vault.members, i);
        if (member.staked && !member.received_payout) {
            count = count + 1;
        };
        i = i + 1;
    };
    count
}

fun pick_gacha_recipient(vault: &Vault, generator: &mut random::RandomGenerator): address {
    let eligible_count = count_eligible_winners(vault);
    assert!(eligible_count > 0, E_NO_ELIGIBLE_RECIPIENT);

    let pick = random::generate_u64_in_range(generator, 0, eligible_count - 1);

    let mut seen = 0;
    let mut i = 0;
    while (i < vector::length(&vault.members)) {
        let member = vector::borrow(&vault.members, i);
        if (member.staked && !member.received_payout) {
            if (seen == pick) {
                return member.addr
            };
            seen = seen + 1;
        };
        i = i + 1;
    };

    abort E_NO_ELIGIBLE_RECIPIENT
}

fun reset_round_payments(vault: &mut Vault) {
    let mut i = 0;
    while (i < vector::length(&vault.members)) {
        let member = vector::borrow_mut(&mut vault.members, i);
        member.paid_current_round = false;
        i = i + 1;
    };
}

fun mark_recipient_paid(vault: &mut Vault, recipient: address) {
    let mut i = 0;
    while (i < vector::length(&vault.members)) {
        let member = vector::borrow_mut(&mut vault.members, i);
        if (member.addr == recipient) {
            member.received_payout = true;
            return
        };
        i = i + 1;
    };
}
