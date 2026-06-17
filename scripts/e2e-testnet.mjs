#!/usr/bin/env node
/**
 * RoundVault E2E — validates the deployed v2 package on Sui testnet.
 *
 * Usage:
 *   node scripts/e2e-testnet.mjs           # read-only smoke tests
 *   node scripts/e2e-testnet.mjs --write   # + create vault tx (needs funded sui CLI wallet)
 */

import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTestnetDeployment } from './load-deployment.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(__dirname, '../frontend/package.json'));
const { SuiJsonRpcClient, getJsonRpcFullnodeUrl } = require('@mysten/sui/jsonRpc');
const { Transaction } = require('@mysten/sui/transactions');

const { packageId: PACKAGE_ID, reputationRegistryId: REPUTATION_REGISTRY_ID } =
  loadTestnetDeployment();

const MODULE = 'vault';
const REPUTATION_MODULE = 'reputation';
const RUN_WRITE = process.argv.includes('--write');

const client = new SuiJsonRpcClient({ url: getJsonRpcFullnodeUrl('testnet'), network: 'testnet' });

let passed = 0;
let failed = 0;

function ok(label, detail = '') {
  passed += 1;
  console.log(`  ✓ ${label}${detail ? ` — ${detail}` : ''}`);
}

function fail(label, err) {
  failed += 1;
  console.error(`  ✗ ${label}`);
  console.error(`    ${err instanceof Error ? err.message : String(err)}`);
}

function eventType(name) {
  return `${PACKAGE_ID}::${MODULE}::${name}`;
}

async function testPackageModules() {
  const mods = await client.getNormalizedMoveModulesByPackage({ package: PACKAGE_ID });
  const names = Object.keys(mods);
  if (!names.includes(MODULE)) {
    throw new Error(`missing ${MODULE} module`);
  }
  if (!names.includes(REPUTATION_MODULE)) {
    throw new Error(`missing ${REPUTATION_MODULE} module`);
  }
  ok('Package modules', `vault + reputation (${names.length} modules total)`);
}

async function testReputationRegistry() {
  const obj = await client.getObject({
    id: REPUTATION_REGISTRY_ID,
    options: { showContent: true, showOwner: true },
  });
  if (!obj.data?.content) throw new Error('registry object has no content');
  const type = obj.data.content.type ?? '';
  if (!type.includes('::reputation::ReputationRegistry')) {
    throw new Error(`unexpected type: ${type}`);
  }
  const owner = obj.data.owner;
  if (!owner || typeof owner !== 'object' || !('Shared' in owner)) {
    throw new Error(`expected Shared owner, got ${JSON.stringify(owner)}`);
  }
  ok('ReputationRegistry', 'shared object on testnet');
}

async function testRegistryDevInspect() {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::${REPUTATION_MODULE}::profile_count`,
    arguments: [tx.object(REPUTATION_REGISTRY_ID)],
  });
  const result = await client.devInspectTransactionBlock({
    sender: '0x0000000000000000000000000000000000000000000000000000000000000001',
    transactionBlock: tx,
  });
  if (result.effects?.status?.status !== 'success') {
    throw new Error(result.effects?.status?.error ?? 'devInspect failed');
  }
  const returnVal = result.results?.[0]?.returnValues?.[0];
  if (!returnVal) throw new Error('no return value from profile_count');
  const [bytes] = returnVal;
  const count = Buffer.from(bytes).readBigUInt64LE(0);
  ok('Registry devInspect', `profile_count = ${count}`);
}

async function testEventIndexing() {
  const [created, repUpdated] = await Promise.all([
    client.queryEvents({
      query: { MoveEventType: eventType('VaultCreated') },
      limit: 5,
      order: 'descending',
    }),
    client.queryEvents({
      query: { MoveEventType: `${PACKAGE_ID}::${REPUTATION_MODULE}::ReputationUpdated` },
      limit: 5,
      order: 'descending',
    }),
  ]);
  ok('VaultCreated events', `${created.data.length} recent (package indexed)`);
  ok('ReputationUpdated events', `${repUpdated.data.length} recent`);
}

async function testVaultObjectShape() {
  const res = await client.queryEvents({
    query: { MoveEventType: eventType('VaultCreated') },
    limit: 1,
    order: 'descending',
  });
  if (res.data.length === 0) {
    ok('Vault object shape', 'skipped — no vaults yet on this package');
    return;
  }
  const vaultId = res.data[0].parsedJson?.vault_id;
  if (!vaultId) throw new Error('VaultCreated event missing vault_id');

  const obj = await client.getObject({
    id: vaultId,
    options: { showContent: true },
  });
  const fields = obj.data?.content?.fields;
  if (!fields) throw new Error('vault has no fields');
  for (const key of ['status', 'members', 'contribution', 'stake_amount', 'pot']) {
    if (!(key in fields)) throw new Error(`vault missing field: ${key}`);
  }
  ok('Vault object shape', `vault ${vaultId.slice(0, 10)}… readable`);
}

async function testWriteCreateVault() {
  let address;
  try {
    address = execSync('sui client active-address', { encoding: 'utf8' }).trim();
  } catch {
    throw new Error('no sui CLI wallet — skip with plain run (omit --write)');
  }

  const gas = await client.getBalance({ owner: address });
  if (BigInt(gas.totalBalance) < 50_000_000n) {
    throw new Error(`insufficient gas on ${address}`);
  }

  const label = `E2E ${new Date().toISOString().slice(0, 16)}`;
  const output = execSync(
    [
      'sui client call',
      `--package ${PACKAGE_ID}`,
      '--module vault',
      '--function create_vault_entry',
      `--args '"${label}"' 2 10000000 10000000 2 3600000`,
      '--gas-budget 20000000',
      '--json',
    ].join(' '),
    { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 },
  );

  const result = JSON.parse(output);
  if (result.effects?.status?.status !== 'success') {
    throw new Error(result.effects?.status?.error ?? 'create_vault tx failed');
  }

  const vault = result.objectChanges?.find(
    (c) => c.type === 'created' && c.objectType?.includes('::vault::Vault'),
  );
  if (!vault) throw new Error('Vault object not created');

  ok(
    'Write create_vault_entry',
    `vault ${vault.objectId.slice(0, 12)}… digest ${result.digest.slice(0, 12)}…`,
  );
}

async function main() {
  console.log('\nRoundVault E2E — Sui testnet');
  console.log(`Package:  ${PACKAGE_ID}`);
  console.log(`Registry: ${REPUTATION_REGISTRY_ID}`);
  console.log(`Mode:     ${RUN_WRITE ? 'read + write' : 'read-only'}\n`);

  const tests = [
    ['Package modules', testPackageModules],
    ['ReputationRegistry object', testReputationRegistry],
    ['Registry devInspect', testRegistryDevInspect],
    ['Event indexing', testEventIndexing],
    ['Vault object shape', testVaultObjectShape],
  ];

  if (RUN_WRITE) {
    tests.push(['Write create_vault', testWriteCreateVault]);
  }

  for (const [name, fn] of tests) {
    try {
      await fn();
    } catch (err) {
      fail(name, err);
    }
  }

  console.log(`\nResult: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
