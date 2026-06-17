import { normalizeSuiAddress } from '@mysten/sui/utils';

const EXPLORER = 'https://suiscan.xyz/testnet';

export function parseBool(value: unknown): boolean {
  return value === true || value === 1 || value === '1' || value === 'true';
}

export function addressesEqual(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false;
  try {
    return normalizeSuiAddress(a) === normalizeSuiAddress(b);
  } catch {
    return a.toLowerCase() === b.toLowerCase();
  }
}

export type ParsedMember = {
  addr: string;
  staked: boolean;
  paidCurrentRound: boolean;
  receivedPayout: boolean;
  missCount: number;
  stakeWithdrawn: boolean;
};

export function parseVaultMember(raw: unknown): ParsedMember | null {
  const item = raw as { fields?: Record<string, unknown> } | Record<string, unknown>;
  const fields =
    item && typeof item === 'object' && 'fields' in item && item.fields
      ? (item.fields as Record<string, unknown>)
      : (item as Record<string, unknown>);
  if (!fields?.addr || typeof fields.addr !== 'string') return null;

  return {
    addr: normalizeSuiAddress(fields.addr),
    staked: parseBool(fields.staked),
    paidCurrentRound: parseBool(fields.paid_current_round),
    receivedPayout: parseBool(fields.received_payout),
    missCount: Number(fields.miss_count ?? 0),
    stakeWithdrawn: parseBool(fields.stake_withdrawn),
  };
}

export function shortenAddress(addr: string, chars = 4): string {
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-chars)}`;
}

export function explorerTx(digest: string): string {
  return `${EXPLORER}/tx/${digest}`;
}

export function explorerObject(id: string): string {
  return `${EXPLORER}/object/${id}`;
}

export function explorerPackage(id: string): string {
  return `${EXPLORER}/object/${id}`;
}

/** Parse Sui Balance<T> field from getObject JSON */
export function parseBalanceField(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (value && typeof value === 'object') {
    const obj = value as { fields?: { value?: string }; value?: string };
    if (obj.fields?.value != null) return obj.fields.value;
    if (obj.value != null) return String(obj.value);
  }
  return '0';
}

export function decodeVaultName(name: number[] | string): string {
  if (typeof name === 'string') return name;
  return new TextDecoder().decode(new Uint8Array(name));
}
