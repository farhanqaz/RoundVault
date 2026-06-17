/** Original package ID — used for events and object types */
export const PACKAGE_ID =
  process.env.NEXT_PUBLIC_PACKAGE_ID ??
  '0x0000000000000000000000000000000000000000000000000000000000000000';

/** Latest published package ID — use for moveCall targets after upgrade */
export const PACKAGE_PUBLISHED_AT =
  process.env.NEXT_PUBLIC_PACKAGE_PUBLISHED_AT ?? PACKAGE_ID;

export const MODULE = 'vault';

export const REPUTATION_MODULE = 'reputation';

/** Shared ReputationRegistry object ID — set after publish */
export const REPUTATION_REGISTRY_ID =
  process.env.NEXT_PUBLIC_REPUTATION_REGISTRY_ID ?? '0x0000000000000000000000000000000000000000000000000000000000000000';

export const STATUS_LABELS: Record<number, string> = {
  0: 'Forming',
  1: 'Collecting',
  2: 'Completed',
};

export const MIST_PER_SUI = 1_000_000_000n;

export function mistToSui(mist: bigint | number | string): string {
  const n = typeof mist === 'bigint' ? mist : BigInt(mist);
  const whole = n / MIST_PER_SUI;
  const frac = n % MIST_PER_SUI;
  if (frac === 0n) return whole.toString();
  return `${whole}.${frac.toString().padStart(9, '0').replace(/0+$/, '')}`;
}

export function suiToMist(sui: string): bigint {
  const [whole, frac = ''] = sui.split('.');
  const padded = (frac + '000000000').slice(0, 9);
  return BigInt(whole) * MIST_PER_SUI + BigInt(padded);
}
