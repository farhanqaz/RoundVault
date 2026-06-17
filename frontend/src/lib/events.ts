import type { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import { MODULE, PACKAGE_ID } from './config';

export type ProtocolStats = {
  vaultsCreated: number;
  totalDistributed: bigint;
  totalSlashed: bigint;
};

export type VaultListing = {
  vaultId: string;
  name: string;
  maxMembers: number;
  contribution: string;
  timestamp: string;
};

function eventType(name: string) {
  return `${PACKAGE_ID}::${MODULE}::${name}`;
}

export async function fetchProtocolStats(client: SuiJsonRpcClient): Promise<ProtocolStats> {
  const [created, distributed, slashed] = await Promise.all([
    client.queryEvents({
      query: { MoveEventType: eventType('VaultCreated') },
      limit: 50,
      order: 'descending',
    }),
    client.queryEvents({
      query: { MoveEventType: eventType('Distributed') },
      limit: 50,
      order: 'descending',
    }),
    client.queryEvents({
      query: { MoveEventType: eventType('Slashed') },
      limit: 50,
      order: 'descending',
    }),
  ]);

  let totalDistributed = 0n;
  for (const e of distributed.data) {
    const p = e.parsedJson as { amount?: string | number } | null;
    if (p?.amount != null) totalDistributed += BigInt(p.amount);
  }

  let totalSlashed = 0n;
  for (const e of slashed.data) {
    const p = e.parsedJson as { amount?: string | number } | null;
    if (p?.amount != null) totalSlashed += BigInt(p.amount);
  }

  return {
    vaultsCreated: created.data.length,
    totalDistributed,
    totalSlashed,
  };
}

export async function fetchRecentVaults(client: SuiJsonRpcClient): Promise<VaultListing[]> {
  const res = await client.queryEvents({
    query: { MoveEventType: eventType('VaultCreated') },
    limit: 20,
    order: 'descending',
  });

  return res.data.map((e) => {
    const p = e.parsedJson as {
      vault_id?: string;
      name?: number[];
      max_members?: string | number;
      contribution?: string | number;
    } | null;
    const nameBytes = p?.name ?? [];
    const name =
      typeof nameBytes === 'string'
        ? nameBytes
        : new TextDecoder().decode(new Uint8Array(nameBytes as number[]));

    return {
      vaultId: p?.vault_id ?? '',
      name: name || 'Unnamed vault',
      maxMembers: Number(p?.max_members ?? 0),
      contribution: String(p?.contribution ?? '0'),
      timestamp: e.timestampMs ?? '0',
    };
  }).filter((v) => v.vaultId);
}
