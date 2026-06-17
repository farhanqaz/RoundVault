import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Load testnet deployment manifest. Env vars take precedence when set.
 */
export function loadTestnetDeployment() {
  const manifest = JSON.parse(
    readFileSync(join(ROOT, 'deployments/testnet.json'), 'utf8'),
  );

  return {
    packageId: process.env.NEXT_PUBLIC_PACKAGE_ID ?? manifest.packageId,
    packagePublishedAt:
      process.env.NEXT_PUBLIC_PACKAGE_PUBLISHED_AT ?? manifest.packagePublishedAt,
    reputationRegistryId:
      process.env.NEXT_PUBLIC_REPUTATION_REGISTRY_ID ?? manifest.reputationRegistryId,
    upgradeCapability: manifest.upgradeCapability,
    publishTxDigest: manifest.publishTxDigest,
    version: manifest.version,
  };
}
