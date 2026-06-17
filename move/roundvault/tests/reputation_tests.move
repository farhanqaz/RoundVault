#[test_only]
module roundvault::reputation_tests;

use roundvault::reputation::{Self, ReputationRegistry};
use roundvault::vault::{Self, Vault, AdminCap};
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

const CONTRIBUTION: u64 = 100_000_000_000;
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

fun setup_registry(scenario: &mut Scenario): ID {
    ts::next_tx(scenario, ADMIN);
    {
        let registry = reputation::create_for_testing(ts::ctx(scenario));
        let id = object::id(&registry);
        reputation::share_for_testing(registry);
        id
    }
}

fun setup_vault_with_registry(scenario: &mut Scenario, registry_id: ID): ID {
    seed_random(scenario);

    ts::next_tx(scenario, ADMIN);
    let vault_id = {
        let cap = vault::create_vault(
            b"Rep Test",
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
            let mut registry = ts::take_shared_by_id<ReputationRegistry>(scenario, registry_id);
            let stake = coin::mint_for_testing<SUI>(STAKE, ts::ctx(scenario));
            reputation::join_vault_rep_entry(&mut vault, stake, &mut registry, ts::ctx(scenario));
            ts::return_shared(vault);
            ts::return_shared(registry);
        };
        i = i + 1;
    };

    vault_id
}

#[test]
fun test_reputation_join_and_contribute() {
    let mut scenario = ts::begin(ADMIN);
    let registry_id = setup_registry(&mut scenario);
    let _vault_id = setup_vault_with_registry(&mut scenario, registry_id);

    ts::next_tx(&mut scenario, ADMIN);
    {
        let registry = ts::take_shared_by_id<ReputationRegistry>(&scenario, registry_id);
        let alice = reputation::get_profile(&registry, ALICE);
        assert!(reputation::profile_vaults_joined(&alice) == 1);
        assert!(reputation::profile_score(&alice) == 5);
        assert!(reputation::profile_count(&registry) == 5);
        ts::return_shared(registry);
    };

    ts::end(scenario);
}

#[test]
fun test_reputation_slash_penalty() {
    let mut scenario = ts::begin(ADMIN);
    let registry_id = setup_registry(&mut scenario);
    let vault_id = setup_vault_with_registry(&mut scenario, registry_id);

    ts::next_tx(&mut scenario, ADMIN);
    {
        let cap = ts::take_from_sender<AdminCap>(&scenario);
        let mut vault = ts::take_shared_by_id<Vault>(&scenario, vault_id);
        let clock = clock::create_for_testing(ts::ctx(&mut scenario));
        vault::activate_vault(&mut vault, &cap, &clock, ts::ctx(&mut scenario));
        clock::destroy_for_testing(clock);
        ts::return_shared(vault);
        ts::return_to_sender(&mut scenario, cap);
    };

    let payers = vector[ALICE, BOB, CAROL, DAVE];
    let mut i = 0;
    while (i < 4) {
        let member = *vector::borrow(&payers, i);
        ts::next_tx(&mut scenario, member);
        {
            let mut vault = ts::take_shared_by_id<Vault>(&scenario, vault_id);
            let mut registry = ts::take_shared_by_id<ReputationRegistry>(&scenario, registry_id);
            let random_obj = ts::take_shared<Random>(&scenario);
            let clk = clock::create_for_testing(ts::ctx(&mut scenario));
            let payment = coin::mint_for_testing<SUI>(CONTRIBUTION, ts::ctx(&mut scenario));
            reputation::contribute_rep_entry(
                &mut vault,
                payment,
                &random_obj,
                &clk,
                &mut registry,
                ts::ctx(&mut scenario),
            );
            clock::destroy_for_testing(clk);
            ts::return_shared(vault);
            ts::return_shared(registry);
            ts::return_shared(random_obj);
        };
        i = i + 1;
    };

    ts::next_tx(&mut scenario, ADMIN);
    {
        let mut vault = ts::take_shared_by_id<Vault>(&scenario, vault_id);
        let mut registry = ts::take_shared_by_id<ReputationRegistry>(&scenario, registry_id);
        let random_obj = ts::take_shared<Random>(&scenario);
        let mut clk = clock::create_for_testing(ts::ctx(&mut scenario));
        clock::increment_for_testing(&mut clk, INTERVAL_MS + 1);
        reputation::settle_round_rep_entry(
            &mut vault,
            &random_obj,
            &clk,
            &mut registry,
            ts::ctx(&mut scenario),
        );
        clock::destroy_for_testing(clk);
        ts::return_shared(vault);
        ts::return_shared(registry);
        ts::return_shared(random_obj);
    };

    ts::next_tx(&mut scenario, ADMIN);
    {
        let registry = ts::take_shared_by_id<ReputationRegistry>(&scenario, registry_id);
        let eve = reputation::get_profile(&registry, EVE);
        assert!(reputation::profile_slashes(&eve) == 1);
        assert!(reputation::profile_score(&eve) == 0);
        let alice = reputation::get_profile(&registry, ALICE);
        assert!(reputation::profile_contributions(&alice) == 1);
        assert!(reputation::profile_score(&alice) >= 15);
        ts::return_shared(registry);
    };

    ts::end(scenario);
}
