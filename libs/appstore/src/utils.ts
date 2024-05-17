/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CellId, CellInfo } from '@holochain/client';
import { Bundle } from '@spartan-hc/bundles';

export function getCellId(cellInfo: CellInfo): CellId | undefined {
  if ('provisioned' in cellInfo) {
    return cellInfo.provisioned.cell_id;
  }
  if ('cloned' in cellInfo) {
    return cellInfo.cloned.cell_id;
  }
  return undefined;
}

export function bundleToDeterministicBytes(bundle: any): Uint8Array {
  if (!['happ', 'webhapp'].includes(bundle.type))
    throw Error('Only happ and webhapp bundles are supported by this function.');

  if (bundle.type === 'happ') {
    bundle.dnas().forEach((dnaBundle, i) => {
      const roleManifest = bundle.manifest.roles[i];
      const rpath = roleManifest.dna.bundled;
      for (const zomeManifest of dnaBundle.manifest.integrity.zomes) {
        if (!zomeManifest.dependencies) {
          zomeManifest.dependencies = null;
        }
      }
      // replace DNA bytes with deterministic bytes
      bundle.resources[rpath] = dnaBundle.toBytes({ sortKeys: true });
    });

    return bundle.toBytes({ sortKeys: true });
  } else {
    const rpath = bundle.manifest.happ_manifest.bundled;
    const happBytes = bundle.resources[rpath];
    const happBundle = new Bundle(happBytes, 'happ');

    happBundle.dnas().forEach((dnaBundle, i) => {
      const roleManifest = happBundle.manifest.roles[i];
      const rpath = roleManifest.dna.bundled;
      for (const zomeManifest of dnaBundle.manifest.integrity.zomes) {
        if (!zomeManifest.dependencies) {
          zomeManifest.dependencies = null;
        }
      }
      // replace DNA bytes with deterministic bytes
      happBundle.resources[rpath] = dnaBundle.toBytes({ sortKeys: true });
    });

    const deterministicHappBytes = happBundle.toBytes({ sortKeys: true });
    bundle.resources[rpath] = deterministicHappBytes;

    return bundle.toBytes({ sortKeys: true });
  }
}
