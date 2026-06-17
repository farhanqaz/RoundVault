#[test_only]
module roundvault::vault_tests;

use roundvault::vault::{Self, Vault, AdminCap};
use std::option;
use sui::clock;
use sui::coin;
use sui::random::{Self, Random};
use sui::sui::SUI;
use sui::test_scenario::{Self as ts, Scenario};

const ADMIN: address = @0xAD;
const ALICE: address = @0xA11CE;
const BOB: address = @0xB0B;
const CAROL: address = @0xCA801;
const DAVE: address = @0xD4;
const EVE: address = @0xE4;

const CONTRIBUTION: u64 = 100_000_000_000; // 0.1 SUI
const STAKE: u64 = 100_000_000_000;
const INTERVAL_MS: u64 = 86_400_000;

const TEST_RANDOM_BYTES: vector<u8> =
    x"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

fun seed_random(scenario: &mut Scenario) {
    ts::next_tx(scenario, @0x0);
    {
        random::create_for_testing(ts::ctx(scenario));
    };

    ts::next_tx(scenario, @0x0);
    {
        let mut random_obj = ts::take_shared<Random>(scenario);
        random::update_randomness_state_for_testing(
            &mut random_obj,
            0,
            TEST_RANDOM_BYTES,
            ts::ctx(scenario),
        );
        ts::return_shared(random_obj);
    };
}

fun setup_five_member_vault(scenario: &mut Scenario): ID {
    seed_random(scenario);

    ts::next_tx(scenario, ADMIN);
    let vault_id = {
        let cap = vault::create_vault(
            b"RoundVault Gacha",
            5,
            CONTRIBUTION,
            STAKE,
            5,
            INTERVAL_MS,
            ts::ctx(scenario),
        );
        let id = vault::admin_cap_vault_id(&cap);
        transfer::public_transfer(cap, ADMIN);
        id
    };

    let members = vector[ALICE, BOB, CAROL, DAVE, EVE];
    let mut i = 0;
    while (i < 5) {
        let member = *vector::borrow(&members, i);
        ts::next_tx(scenario, member);
        {
            let mut vault = ts::take_shared<Vault>(scenario);
            let stake = coin::mint_for_testing<SUI>(STAKE, ts::ctx(scenario));
            vault::join_vault(&mut vault, stake, ts::ctx(scenario));
            ts::return_shared(vault);
        };
        i = i + 1;
    };

    ts::next_tx(scenario, ADMIN);
    {
        let cap = ts::take_from_sender<AdminCap>(scenario);
        let mut vault = ts::take_shared<Vault>(scenario);
        let clock = clock::create_for_testing(ts::ctx(scenario));
        vault::activate_vault(&mut vault, &cap, &clock, ts::ctx(scenario));
        clock::destroy_for_testing(clock);
        ts::return_shared(vault);
        ts::return_to_sender(scenario, cap);
    };

    vault_id
}

#[test]
fun test_gacha_first_distribution() {
    let mut scenario = ts::begin(ADMIN);
    let vault_id = setup_five_member_vault(&mut scenario);

    let members = vector[ALICE, BOB, CAROL, DAVE, EVE];
    let mut i = 0;
    while (i < 5) {
        let member = *vector::borrow(&members, i);
        ts::next_tx(&mut scenario, member);
        {
            let mut vault = ts::take_shared_by_id<Vault>(&scenario, vault_id);
            let payment = coin::mint_for_testing<SUI>(CONTRIBUTION, ts::ctx(&mut scenario));
            vault::contribute(&mut vault, payment, ts::ctx(&mut scenario));
            ts::return_shared(vault);
        };
        i = i + 1;
    };

    ts::next_tx(&mut scenario, ADMIN);
    {
        let mut vault = ts::take_shared_by_id<Vault>(&scenario, vault_id);
        let random_obj = ts::take_shared<Random>(&scenario);
        let clock = clock::create_for_testing(ts::ctx(&mut scenario));
        let result = vault::settle_round(&mut vault, &random_obj, &clock, ts::ctx(&mut scenario));
        let recipient = vault::settlement_recipient(&result);
        assert!(option::is_some(&recipient));
        assert!(vault::current_round(&vault) == 1);
        assert!(vault::pot_balance(&vault) == 0);
        assert!(vault::eligible_winner_count(&vault) == 4);
        let winner = *option::borrow(&recipient);
        assert!(winner == ALICE || winner == BOB || winner == CAROL || winner == DAVE || winner == EVE);
        clock::destroy_for_testing(clock);
        ts::return_shared(vault);
        ts::return_shared(random_obj);
    };

    ts::end(scenario);
}

#[test]
fun test_auto_settle_on_last_contribute() {
    let mut scenario = ts::begin(ADMIN);
    let vault_id = setup_five_member_vault(&mut scenario);

    let members = vector[ALICE, BOB, CAROL, DAVE];
    let mut i = 0;
    while (i < 4) {
        let member = *vector::borrow(&members, i);
        ts::next_tx(&mut scenario, member);
        {
            let mut vault = ts::take_shared_by_id<Vault>(&scenario, vault_id);
            let payment = coin::mint_for_testing<SUI>(CONTRIBUTION, ts::ctx(&mut scenario));
            vault::contribute(&mut vault, payment, ts::ctx(&mut scenario));
            ts::return_shared(vault);
        };
        i = i + 1;
    };

    ts::next_tx(&mut scenario, EVE);
    {
        let mut vault = ts::take_shared_by_id<Vault>(&scenario, vault_id);
        let random_obj = ts::take_shared<Random>(&scenario);
        let clock = clock::create_for_testing(ts::ctx(&mut scenario));
        let payment = coin::mint_for_testing<SUI>(CONTRIBUTION, ts::ctx(&mut scenario));
        vault::contribute(&mut vault, payment, ts::ctx(&mut scenario));
        let result = vault::settle_round(&mut vault, &random_obj, &clock, ts::ctx(&mut scenario));
        assert!(option::is_some(&vault::settlement_recipient(&result)));
        assert!(vault::current_round(&vault) == 1);
        clock::destroy_for_testing(clock);
        ts::return_shared(vault);
        ts::return_shared(random_obj);
    };

    ts::end(scenario);
}

#[test]
fun test_slash_defaulter() {
    let mut scenario = ts::begin(ADMIN);
    let vault_id = setup_five_member_vault(&mut scenario);

    let payers = vector[ALICE, BOB, CAROL, DAVE];
    let mut i = 0;
    while (i < 4) {
        let member = *vector::borrow(&payers, i);
        ts::next_tx(&mut scenario, member);
        {
            let mut vault = ts::take_shared_by_id<Vault>(&scenario, vault_id);
            let payment = coin::mint_for_testing<SUI>(CONTRIBUTION, ts::ctx(&mut scenario));
            vault::contribute(&mut vault, payment, ts::ctx(&mut scenario));
            ts::return_shared(vault);
        };
        i = i + 1;
    };

    ts::next_tx(&mut scenario, ADMIN);
    {
        let mut vault = ts::take_shared_by_id<Vault>(&scenario, vault_id);
        let random_obj = ts::take_shared<Random>(&scenario);
        let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));
        clock::increment_for_testing(&mut clock, INTERVAL_MS + 1);
        let result = vault::settle_round(&mut vault, &random_obj, &clock, ts::ctx(&mut scenario));
        let slashed = vault::settlement_slashed(&result);
        assert!(vector::length(&slashed) == 1);
        assert!(*vector::borrow(&slashed, 0) == EVE);
        assert!(vault::total_slashed(&vault) == STAKE);
        assert!(option::is_some(&vault::settlement_recipient(&result)));
        assert!(vault::current_round(&vault) == 1);
        clock::destroy_for_testing(clock);
        ts::return_shared(vault);
        ts::return_shared(random_obj);
    };

    ts::end(scenario);
}
