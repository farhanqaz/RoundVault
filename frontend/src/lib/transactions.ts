import { Transaction } from '@mysten/sui/transactions';
import { MODULE, PACKAGE_ID, REPUTATION_MODULE, REPUTATION_REGISTRY_ID, suiToMist } from './config';

function target(fn: string) {
  return `${PACKAGE_ID}::${MODULE}::${fn}`;
}

function repTarget(fn: string) {
  return `${PACKAGE_ID}::${REPUTATION_MODULE}::${fn}`;
}

function reputationArg(tx: Transaction) {
  return tx.object(REPUTATION_REGISTRY_ID);
}

export function buildCreateVaultTx(params: {
  name: string;
  maxMembers: number;
  contributionSui: string;
  stakeSui: string;
  intervalMs: number;
}): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: target('create_vault_entry'),
    arguments: [
      tx.pure.string(params.name),
      tx.pure.u64(params.maxMembers),
      tx.pure.u64(suiToMist(params.contributionSui)),
      tx.pure.u64(suiToMist(params.stakeSui)),
      tx.pure.u8(params.maxMembers),
      tx.pure.u64(params.intervalMs),
    ],
  });
  return tx;
}

export function buildJoinVaultTx(vaultId: string, stakeMist: bigint): Transaction {
  const tx = new Transaction();
  const [stake] = tx.splitCoins(tx.gas, [stakeMist]);
  tx.moveCall({
    target: repTarget('join_vault_rep_entry'),
    arguments: [tx.object(vaultId), stake, reputationArg(tx)],
  });
  return tx;
}

export function buildActivateVaultTx(vaultId: string, adminCapId: string): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: target('activate_vault_entry'),
    arguments: [tx.object(vaultId), tx.object(adminCapId), tx.object.clock()],
  });
  return tx;
}

export function buildContributeTx(vaultId: string, amountMist: bigint): Transaction {
  const tx = new Transaction();
  const [payment] = tx.splitCoins(tx.gas, [amountMist]);
  tx.moveCall({
    target: repTarget('contribute_rep_entry'),
    arguments: [
      tx.object(vaultId),
      payment,
      tx.object.random(),
      tx.object.clock(),
      reputationArg(tx),
    ],
  });
  return tx;
}

export function buildSettleRoundTx(vaultId: string): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: repTarget('settle_round_rep_entry'),
    arguments: [tx.object(vaultId), tx.object.random(), tx.object.clock(), reputationArg(tx)],
  });
  return tx;
}

export function buildWithdrawStakeTx(vaultId: string): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: repTarget('withdraw_stake_rep_entry'),
    arguments: [tx.object(vaultId), reputationArg(tx)],
  });
  return tx;
}
