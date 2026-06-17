const EXPLORER = 'https://suiscan.xyz/testnet';

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
