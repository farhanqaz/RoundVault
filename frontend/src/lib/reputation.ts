import type { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_ID, REPUTATION_MODULE, REPUTATION_REGISTRY_ID } from './config';

export type ReputationProfile = {
  vaultsJoined: number;
  vaultsCompleted: number;
  contributions: number;
  totalContributed: bigint;
  payoutsReceived: number;
  totalPayoutAmount: bigint;
  slashes: number;
  score: number;
};

export type LeaderboardEntry = {
  address: string;
  score: number;
  vaultsJoined: number;
  vaultsCompleted: number;
  contributions: number;
  payoutsReceived: number;
  slashes: number;
  lastUpdated: string;
};

function repEventType(name: string) {
  return `${PACKAGE_ID}::${REPUTATION_MODULE}::${name}`;
}

function target(fn: string) {
  return `${PACKAGE_ID}::${REPUTATION_MODULE}::${fn}`;
}

function decodeProfileBytes(bytes: number[]): ReputationProfile {
  const view = new DataView(new Uint8Array(bytes).buffer);
  let offset = 0;
  const readU64 = () => {
    const value = view.getBigUint64(offset, true);
    offset += 8;
    return value;
  };
  return {
    vaultsJoined: Number(readU64()),
    vaultsCompleted: Number(readU64()),
    contributions: Number(readU64()),
    totalContributed: readU64(),
    payoutsReceived: Number(readU64()),
    totalPayoutAmount: readU64(),
    slashes: Number(readU64()),
    score: Number(readU64()),
  };
}

function isZeroAddress(addr: string) {
  return !addr || addr.startsWith('0x0000');
}

/** Read on-chain reputation via devInspect (no gas). Works for any address. */
export async function fetchReputationProfile(
  client: SuiJsonRpcClient,
  address: string,
  registryId: string = REPUTATION_REGISTRY_ID,
): Promise<ReputationProfile | null> {
  if (isZeroAddress(registryId) || !address.startsWith('0x')) return null;

  const tx = new Transaction();
  tx.moveCall({
    target: target('get_profile'),
    arguments: [tx.object(registryId), tx.pure.address(address)],
  });

  try {
    const result = await client.devInspectTransactionBlock({
      sender: address,
      transactionBlock: tx,
    });

    if (result.error) return null;
    const returnValues = result.results?.[0]?.returnValues;
    if (!returnValues?.[0]) return null;

    const [bytes] = returnValues[0];
    return decodeProfileBytes(bytes);
  } catch {
    return null;
  }
}

/** Build leaderboard from latest ReputationUpdated events per member. */
export async function fetchReputationLeaderboard(
  client: SuiJsonRpcClient,
  limit = 50,
): Promise<LeaderboardEntry[]> {
  if (isZeroAddress(REPUTATION_REGISTRY_ID)) return [];

  const res = await client.queryEvents({
    query: { MoveEventType: repEventType('ReputationUpdated') },
    limit: 200,
    order: 'descending',
  });

  const byMember = new Map<string, LeaderboardEntry>();

  for (const e of res.data) {
    const p = e.parsedJson as {
      member?: string;
      score?: string | number;
      vaults_joined?: string | number;
      vaults_completed?: string | number;
      contributions?: string | number;
      payouts_received?: string | number;
      slashes?: string | number;
    } | null;

    const member = p?.member;
    if (!member || byMember.has(member)) continue;

    byMember.set(member, {
      address: member,
      score: Number(p?.score ?? 0),
      vaultsJoined: Number(p?.vaults_joined ?? 0),
      vaultsCompleted: Number(p?.vaults_completed ?? 0),
      contributions: Number(p?.contributions ?? 0),
      payoutsReceived: Number(p?.payouts_received ?? 0),
      slashes: Number(p?.slashes ?? 0),
      lastUpdated: e.timestampMs ?? '0',
    });
  }

  return [...byMember.values()]
    .filter((entry) => entry.score > 0 || entry.contributions > 0 || entry.vaultsJoined > 0)
    .sort((a, b) => b.score - a.score || b.contributions - a.contributions)
    .slice(0, limit);
}

export function reputationTier(score: number): { label: string; color: string } {
  if (score >= 500) return { label: 'Trusted', color: 'emerald' };
  if (score >= 200) return { label: 'Reliable', color: 'blue' };
  if (score >= 50) return { label: 'Active', color: 'amber' };
  if (score > 0) return { label: 'Newcomer', color: 'zinc' };
  return { label: 'Unrated', color: 'zinc' };
}

export function isEmptyProfile(profile: ReputationProfile): boolean {
  return (
    profile.score === 0 &&
    profile.vaultsJoined === 0 &&
    profile.contributions === 0 &&
    profile.payoutsReceived === 0
  );
}
