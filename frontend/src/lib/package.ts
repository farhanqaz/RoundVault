import type { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import { PACKAGE_PUBLISHED_AT, REPUTATION_MODULE } from './config';

let cachedJoinAndContribute: boolean | null = null;

/** True when upgraded package exposes join_and_contribute_rep_entry */
export async function packageHasJoinAndContribute(
  client: SuiJsonRpcClient,
): Promise<boolean> {
  if (cachedJoinAndContribute != null) return cachedJoinAndContribute;
  if (process.env.NEXT_PUBLIC_USE_JOIN_AND_CONTRIBUTE === 'true') {
    cachedJoinAndContribute = true;
    return true;
  }
  try {
    const mods = await client.getNormalizedMoveModulesByPackage({
      package: PACKAGE_PUBLISHED_AT,
    });
    const rep = mods[REPUTATION_MODULE];
    cachedJoinAndContribute = !!rep?.exposedFunctions?.join_and_contribute_rep_entry;
  } catch {
    cachedJoinAndContribute = false;
  }
  return cachedJoinAndContribute;
}

export function resetPackageFeatureCache() {
  cachedJoinAndContribute = null;
}
