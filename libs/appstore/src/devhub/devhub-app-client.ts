/* eslint-disable @typescript-eslint/no-explicit-any */
import type { DnaHash, ProvisionedCell } from '@holochain/client';
import { type AnyDhtHash, type AppClient, CellType, type ZomeName } from '@holochain/client';
import { Bundle } from '@spartan-hc/bundles';

import { MereMemoryZomeClient } from '../mere-memory/zomes/mere-memory-zome-client';
import { getCellId } from '../utils';
import type { DnaAssetHashes, Zome, ZomeEntry } from './types';
import {
  type CreateWebAppPackageFrontendInput,
  type DevhubAppEntry,
  type DnaEntry,
  type DnaToken,
  type Entity,
  type Ui,
  type UiEntry,
  type WebAppEntry,
  type WebAppPackageEntry,
  ZomeType,
} from './types';
import { AppHubZomeClient } from './zomes/apphub-zome-client';
import { DnaHubZomeClient } from './zomes/dnahub-zome-client';
import { ZomeHubZomeClient } from './zomes/zomehub-zome-client';

export class DevhubAppClient {
  zomeHubMereMemoryZomeClient: MereMemoryZomeClient;
  appHubMereMemoryZomeClient: MereMemoryZomeClient;
  zomeHubZomeClient: ZomeHubZomeClient;
  dnaHubZomeClient: DnaHubZomeClient;
  appHubZomeClient: AppHubZomeClient;

  cachedApphubDnaHash: DnaHash | undefined;

  constructor(public client: AppClient) {
    this.zomeHubMereMemoryZomeClient = new MereMemoryZomeClient(
      client,
      'zomehub',
      'mere_memory_api',
    );
    this.appHubMereMemoryZomeClient = new MereMemoryZomeClient(client, 'apphub', 'mere_memory_api');
    this.zomeHubZomeClient = new ZomeHubZomeClient(client, 'zomehub', 'zomehub_csr');
    this.dnaHubZomeClient = new DnaHubZomeClient(client, 'dnahub', 'dnahub_csr');
    this.appHubZomeClient = new AppHubZomeClient(client, 'apphub', 'apphub_csr');
  }

  /**
   * Dna Hash of the apphub cell of DevHub
   * @returns
   */
  async apphubDnaHash() {
    if (this.cachedApphubDnaHash) return this.cachedApphubDnaHash;
    const appInfo = await this.client.appInfo();
    if (!appInfo) throw new Error('AppInfo undefined.');
    const apphubCellInfo = appInfo.cell_info.apphub.find(
      (cellInfo) => CellType.Provisioned in cellInfo,
    );
    if (!apphubCellInfo) throw new Error('apphub cell not found');
    const apphubCell = (
      apphubCellInfo as {
        [CellType.Provisioned]: ProvisionedCell;
      }
    )[CellType.Provisioned];
    this.cachedApphubDnaHash = apphubCell.cell_id[0];
    return apphubCell.cell_id[0];
  }

  async saveIntegrityZome(bytes: Uint8Array): Promise<Entity<ZomeEntry>> {
    const mereMemoryAddress = await this.zomeHubMereMemoryZomeClient.saveBytes(bytes);
    return this.zomeHubZomeClient.createZome({
      zome_type: ZomeType.Integrity,
      mere_memory_addr: mereMemoryAddress,
    });
  }

  async saveCoordinatorZome(bytes: Uint8Array): Promise<Entity<ZomeEntry>> {
    const mereMemoryAddress = await this.zomeHubMereMemoryZomeClient.saveBytes(bytes);
    return this.zomeHubZomeClient.createZome({
      zome_type: ZomeType.Coordinator,
      mere_memory_addr: mereMemoryAddress,
    });
  }

  async getZome(addr: AnyDhtHash): Promise<Zome> {
    const zomeEntryEntity = await this.zomeHubZomeClient.getZomeEntry(addr);
    const zomeEntry = zomeEntryEntity.content;
    const [_memoryEntry, zomeBytes] = await this.zomeHubMereMemoryZomeClient.getMemoryWithBytes(
      zomeEntry.mere_memory_addr,
    );
    return {
      zome_type: zomeEntry.zome_type,
      mere_memory_addr: zomeEntry.mere_memory_addr,
      file_size: zomeEntry.file_size,
      hash: zomeEntry.hash,
      bytes: zomeBytes,
    };
  }

  async getIntegritZome(input: { dnaEntryAddress: AnyDhtHash; name: ZomeName }): Promise<Zome> {
    const dnaEntryEntity = await this.dnaHubZomeClient.getDnaEntry(input.dnaEntryAddress);
    const zomeManifest = dnaEntryEntity.content.manifest.integrity.zomes.find(
      (zomeManifest) => zomeManifest.name === input.name,
    );

    if (!zomeManifest)
      throw new Error(
        `DNA entry (${input.dnaEntryAddress}) does not have an integrity zome named '${input.name}'`,
      );

    return this.getZome(zomeManifest.zome_hrl!.target);
  }

  async getCoordinatorZome(input: { dnaEntryAddress: AnyDhtHash; name: ZomeName }): Promise<Zome> {
    const dnaEntryEntity = await this.dnaHubZomeClient.getDnaEntry(input.dnaEntryAddress);
    const zomeManifest = dnaEntryEntity.content.manifest.coordinator.zomes.find(
      (zomeManifest) => zomeManifest.name === input.name,
    );

    if (!zomeManifest)
      throw new Error(
        `DNA entry (${input.dnaEntryAddress}) does not have an coordinator zome named '${input.name}'`,
      );

    return this.getZome(zomeManifest.zome_hrl!.target);
  }

  async getDnaBundle(addr: AnyDhtHash) {
    const dnaEntryEntity = await this.dnaHubZomeClient.getDnaEntry(addr);

    for (const zomeManifest of dnaEntryEntity.content.manifest.integrity.zomes as any) {
      const wasm = await this.getZome(zomeManifest.wasmHrl.target);
      zomeManifest.bytes = wasm.bytes;
      delete zomeManifest.zome_hrl;
    }

    for (const zomeManifest of dnaEntryEntity.content.manifest.coordinator.zomes as any) {
      const wasm = await this.getZome(zomeManifest.wasmHrl.target);
      zomeManifest.bytes = wasm.bytes;
      delete zomeManifest.zome_hrl;
    }

    const bundle = Bundle.createDna(dnaEntryEntity.content.manifest);

    return bundle.toBytes();
  }

  async saveDna(bytes: Uint8Array): Promise<Entity<DnaEntry>> {
    const bundle = new Bundle(bytes, 'dna');

    const devhubAppInfo = await this.client.appInfo();
    if (!devhubAppInfo) throw new Error('Failed to get app info of devhub');
    const zomeHubCellInfo = devhubAppInfo.cell_info.zomehub.find(
      (cellInfo) => CellType.Provisioned in cellInfo,
    );
    if (!zomeHubCellInfo) throw new Error('No zome_hub cell found.');
    const zomeHubCell = (
      zomeHubCellInfo as {
        [CellType.Provisioned]: ProvisionedCell;
      }
    )[CellType.Provisioned];
    const zomehubCellId = zomeHubCell.cell_id;
    if (!zomehubCellId) throw new Error('zome_hub CellId undefined.');

    const dna_asset_hashes: DnaAssetHashes = {
      integrity: {},
      coordinator: {},
    };

    for (const zome_manifest of bundle.manifest.integrity.zomes) {
      const rpath = zome_manifest.bundled;
      const zome_bytes = bundle.resources[rpath];
      const zomeEntity = await this.saveIntegrityZome(zome_bytes);

      zome_manifest.zome_hrl = {
        dna: zomehubCellId[0],
        target: zomeEntity.content.mere_memory_addr,
      };

      dna_asset_hashes.integrity[zome_manifest.name] = zomeEntity.content.hash;
      delete zome_manifest.bundled;
    }

    for (const zome_manifest of bundle.manifest.coordinator.zomes) {
      const rpath = zome_manifest.bundled;
      const zome_bytes = bundle.resources[rpath];
      const zomeEntity = await this.saveCoordinatorZome(zome_bytes);

      zome_manifest.zome_hrl = {
        dna: zomehubCellId[0],
        target: zomeEntity.content.mere_memory_addr,
      };

      dna_asset_hashes.coordinator[zome_manifest.name] = zomeEntity.content.hash;
      delete zome_manifest.bundled;
    }

    return this.dnaHubZomeClient.createDna({
      manifest: bundle.manifest,
      claimed_file_size: bytes.length,
      asset_hashes: dna_asset_hashes,
    });
  }

  async saveApp(bytes: Uint8Array): Promise<Entity<DevhubAppEntry>> {
    const bundle = new Bundle(bytes, 'happ');
    const roles_dna_tokens: Record<string, DnaToken> = {};

    for (const role of bundle.manifest.roles) {
      const name = role.name;
      const rpath = role.dna.bundled;
      const dna_bytes = bundle.resources[rpath];

      const dnaEntry = await this.saveDna(dna_bytes);

      const devhubAppInfo = await this.client.appInfo();
      if (!devhubAppInfo) throw new Error('Failed to get app info of devhub');
      const dnaHubCell = devhubAppInfo.cell_info.zomehub;
      const dnaHubCellProvisioned = dnaHubCell.find((cellInfo) => 'provisioned' in cellInfo);
      if (!dnaHubCellProvisioned) throw new Error('No zome_hub cell found.');
      const dnaHubCellId = getCellId(dnaHubCellProvisioned);
      if (!dnaHubCellId) throw new Error('zome_hub CellId undefined.');

      role.dna.dna_hrl = {
        dna: dnaHubCellId[0],
        target: dnaEntry.address,
      };

      delete role.dna.bundled;

      roles_dna_tokens[name] = dnaEntry.content.dna_token;
    }

    return await this.appHubZomeClient.createApp({
      manifest: bundle.manifest,
      roles_dna_tokens,
      claimed_file_size: bytes.length,
    });
  }

  async saveUi(bytes: Uint8Array): Promise<Entity<UiEntry>> {
    const mereMemoryAddress = await this.appHubMereMemoryZomeClient.saveBytes(bytes);
    return this.appHubZomeClient.createUi({ mere_memory_addr: mereMemoryAddress });
  }

  async getUi(address: AnyDhtHash): Promise<Ui> {
    const uiEntryEntity = await this.appHubZomeClient.getUiEntry(address);
    const uiEntry = uiEntryEntity.content;
    const [_memoryEntry, uiBytes] = await this.appHubMereMemoryZomeClient.getMemoryWithBytes(
      uiEntry.mere_memory_addr,
    );
    return {
      mere_memory_addr: uiEntry.mere_memory_addr,
      file_size: uiEntry.file_size,
      bytes: uiBytes,
    };
  }

  async getUiBytes(address: AnyDhtHash): Promise<Uint8Array> {
    const uiEntryEntity = await this.appHubZomeClient.getUiEntry(address);
    return this.appHubMereMemoryZomeClient.getMemoryWithBytes(
      uiEntryEntity.content.mere_memory_addr,
    )[1];
  }

  async createWebappPackage(
    input: CreateWebAppPackageFrontendInput,
  ): Promise<Entity<WebAppPackageEntry>> {
    const iconAddress = await this.appHubMereMemoryZomeClient.saveBytes(input.icon);
    const updatedInput = { ...input, icon: iconAddress };
    return this.appHubZomeClient.createWebappPackage(updatedInput);
  }

  async saveWebapp(bytes: Uint8Array): Promise<Entity<WebAppEntry>> {
    const bundle = new Bundle(bytes, 'webhapp');

    {
      const happManifest = bundle.manifest.happ_manifest;
      const happBytes = bundle.resources[happManifest.bundled];

      const appEntry = await this.saveApp(happBytes);

      happManifest.app_entry = appEntry.address;
      delete happManifest.bundled;
    }
    {
      const uiManifest = bundle.manifest.ui;
      const uiBytes = bundle.resources[uiManifest.bundled];

      const uiEntry = await this.saveUi(uiBytes);

      uiManifest.ui_entry = uiEntry.address;
      delete uiManifest.bundled;
    }

    return await this.appHubZomeClient.createWebapp({
      manifest: bundle.manifest,
    });
  }

  // TODO if required
  // getWebhappBundle
  // getHappBundle
  // getAppDnaEntry
}
