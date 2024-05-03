/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ActionHash, AppClient } from '@holochain/client';
import { Bundle } from '@spartan-hc/bundles';
import { sha256 } from 'js-sha256';

import type {
  AppAsset,
  DnaAsset,
  Entity,
  UiAsset,
  UpdateEntityInput,
  WebAppAsset,
  WebAppEntry,
  WebAppPackageVersionEntry,
} from '../devhub/types';
import { MereMemoryZomeClient } from '../mere-memory/zomes/mere-memory-zome-client';
import type {
  AppEntry,
  AppVersionEntry,
  CreateAppFrontendInput,
  CreatePublisherFrontendInput,
  PublisherEntry,
  UpdatePublisherFrontendInput,
} from './types';
import { AppstoreZomeClient } from './zomes/appstore-zome-client';
import { PortalZomeClient } from './zomes/portal-zome-client';

export class AppstoreAppClient {
  mereMemoryZomeClient: MereMemoryZomeClient;
  appstoreZomeClient: AppstoreZomeClient;
  portalZomeClient: PortalZomeClient;

  constructor(public client: AppClient) {
    this.mereMemoryZomeClient = new MereMemoryZomeClient(client, 'appstore', 'mere_memory_api');
    this.appstoreZomeClient = new AppstoreZomeClient(client, 'appstore', 'appstore_csr');
    this.portalZomeClient = new PortalZomeClient(client, 'portal', 'portal_csr');
  }

  async createPublisher(input: CreatePublisherFrontendInput): Promise<Entity<PublisherEntry>> {
    const iconBytes = await this.mereMemoryZomeClient.saveBytes(input.icon);
    return this.appstoreZomeClient.createPublisher({
      ...input,
      icon: iconBytes,
    });
  }

  async updatePublisher(
    input: UpdateEntityInput<UpdatePublisherFrontendInput>,
  ): Promise<Entity<PublisherEntry>> {
    const iconBytes = input.properties.icon
      ? await this.mereMemoryZomeClient.saveBytes(input.properties.icon)
      : null;
    const updatedInput = {
      ...input,
      properties: {
        ...input.properties,
        ...(iconBytes && { icon: iconBytes }),
      },
    };
    return this.appstoreZomeClient.updatePublisher(updatedInput);
  }

  async createApp(input: CreateAppFrontendInput): Promise<Entity<AppEntry>> {
    const iconBytes = await this.mereMemoryZomeClient.saveBytes(input.icon);
    return this.appstoreZomeClient.createApp({
      ...input,
      icon: iconBytes,
    });
  }

  /**
   * Checks whether a new update is available for a given AppVersionEntry action hash
   *
   * An update is considered valid if
   * - the happ sha256 is identical to the happ sha256 of the existing AppVersionEntry
   * - the ui sha256 is different from the ui sha256 of the existing AppVersionEntry
   * - the AppVersionEntry is published later than the current AppVersionEntry
   *
   * @param appVersionActionHash
   * @returns
   */
  async checkForUiUpdate(
    appVersionActionHash: ActionHash,
  ): Promise<Entity<AppVersionEntry> | undefined> {
    // logic
    // we need to check that there is a new version available and that the happ bundle hash is the same but the ui hash is different
    const appVersionEntity = await this.appstoreZomeClient.getAppVersion(appVersionActionHash);
    const appVersions = await this.appstoreZomeClient.getAppVersionsForApp(
      appVersionEntity.content.for_app,
    );
    // Check for newer versions
    const updateCandidates = appVersions
      .filter((entity) => entity.content.published_at > appVersionEntity.content.published_at)
      .filter(
        (entity) =>
          entity.content.bundle_hashes.happ_hash ===
          appVersionEntity.content.bundle_hashes.happ_hash,
      )
      .filter(
        (entity) =>
          entity.content.bundle_hashes.ui_hash !== appVersionEntity.content.bundle_hashes.ui_hash,
      )
      .sort((a, b) => b.content.published_at - a.content.published_at);

    if (updateCandidates.length > 0) return updateCandidates[0];
    return undefined;
  }

  // async fetchHappBytes();

  /**
   * Fetches the UI bytes for a given app version
   * @param appVersion
   */
  async fetchUiBytes(appVersion: AppVersionEntry): Promise<Uint8Array> {
    // For simplicity make all calls with one host. If that proves to not work well, split into
    // separate calls to different hosts
    return this.portalZomeClient.tryWithHosts<Uint8Array>(
      async (host) => {
        // 1. get WebappPackageVersionEntry and verify its hash
        const webappPackageVersion =
          await this.portalZomeClient.customRemoteCall<WebAppPackageVersionEntry>({
            host,
            call: {
              dna: appVersion.apphub_hrl.dna,
              zome: 'apphub_csr',
              function: 'get_webapp_package_version_entry',
              payload: appVersion.apphub_hrl.target,
            },
          });
        // validate hash of received entry
        const webappPackageVersionEntryHash =
          await this.appstoreZomeClient.hashWebappPackageVersionEntry(webappPackageVersion);
        if (webappPackageVersionEntryHash.toString() !== appVersion.apphub_hrl_hash.toString()) {
          throw new Error(
            'Hash of received WebappPackageVersionEntry does not match the expected hash.',
          );
        }

        // 2. Get the WebappEntry to figure out the entry hash of the UI
        const webappEntryEntity = await this.portalZomeClient.customRemoteCall<Entity<WebAppEntry>>(
          {
            host,
            call: {
              dna: appVersion.apphub_hrl.dna,
              zome: 'apphub_csr',
              function: 'get_webapp_entry',
              payload: webappPackageVersion.webapp,
            },
          },
        );
        // validate hash of received entry
        const webappEntryHash = await this.appstoreZomeClient.hashWebappEntry(
          webappEntryEntity.content,
        );
        if (webappEntryHash.toString() !== webappPackageVersion.webapp.toString()) {
          throw new Error('Hash of received WebappEntry does not match the expected hash.');
        }

        console.log('Got WebappEntry: ', webappEntryEntity.content);

        // 2. Get UI asset
        // happy path
        const uiAsset = await this.portalZomeClient.customRemoteCall<UiAsset>({
          host,
          call: {
            dna: appVersion.apphub_hrl.dna,
            zome: 'apphub_csr',
            function: 'get_ui_asset',
            payload: (webappEntryEntity.content.manifest.ui as any).ui_entry,
          },
        });

        console.log('Got uiAsset: ', uiAsset);

        const bytes = this.mereMemoryZomeClient.decompressBytes(
          uiAsset.memory_entry,
          uiAsset.bytes,
        );

        // Verify integrity of bytes
        if (appVersion.bundle_hashes.ui_hash !== sha256.hex(bytes))
          throw new Error('Hash of received UI bytes does not match the expected hash.');

        return bytes;
      },
      {
        dna: appVersion.apphub_hrl.dna,
        zome: 'apphub_csr',
        function: 'get_webapp_package_version_entry', // We just pick one of the functions for the sake of simplicity and assume that all other functions are callable as well by the same host
      },
      4000,
    );
  }

  /**
   * Fetches the webhapp bytes for a given app version via sequential remote calls to devhub hosts
   * @param appVersion
   */
  async fetchWebappBytes(appVersion: AppVersionEntry): Promise<Uint8Array> {
    // For simplicity make all calls with one host. If that proves to not work well, split into
    // separate calls to different hosts
    return this.portalZomeClient.tryWithHosts<Uint8Array>(
      async (host) => {
        // 1. get WebappPackageVersion and verify its hash
        const webappPackageVersion =
          await this.portalZomeClient.customRemoteCall<WebAppPackageVersionEntry>({
            host,
            call: {
              dna: appVersion.apphub_hrl.dna,
              zome: 'apphub_csr',
              function: 'get_webapp_package_version_entry',
              payload: appVersion.apphub_hrl.target,
            },
          });
        // validate hash of received entry
        const webappPackageVersionEntryHash =
          await this.appstoreZomeClient.hashWebappPackageVersionEntry(webappPackageVersion);
        if (webappPackageVersionEntryHash.toString() !== appVersion.apphub_hrl_hash.toString()) {
          throw new Error(
            'Hash of received WebappPackageVersionEntry does not match expected hash.',
          );
        }

        console.log('Got webapp package version: ', webappPackageVersion);

        // 2. Get webhapp bundle
        // happy path
        const webappAsset = await this.portalZomeClient.customRemoteCall<WebAppAsset>({
          host,
          call: {
            dna: appVersion.apphub_hrl.dna,
            zome: 'apphub_csr',
            function: 'get_webapp_asset',
            payload: webappPackageVersion.webapp,
          },
        });

        console.log('Got webappAsset: ', webappAsset);

        // TODO verify assets
        // await this.appstoreZomeClient.verifyWebappAsset(webappAsset, webappPackageVersion.webapp);

        // Create webapp bundle
        const webappBundle = this.bundleFromWebappAsset(webappAsset);

        console.log('Got webappBundle: ', webappBundle);

        const bytes = webappBundle.toBytes();

        if (appVersion.bundle_hashes.hash !== sha256.hex(bytes))
          throw new Error('Hash of received webapp bytes does not match the expected hash.');

        return bytes;

        // 2.1 get WebappEntry and verify its integrity
        // const webappEntryEntity = await this.portalZomeClient.customRemoteCall<Entity<WebAppEntry>>(
        //   {
        //     host,
        //     call: {
        //       dna: devhubDnaHash,
        //       zome: 'apphub_csr',
        //       function: 'get_webapp_entry',
        //       payload: webappPackageVersion.webapp,
        //     },
        //   },
        // );
        // validate hash of received entry
        // const webappEntryHash = await this.appstoreZomeClient.hashWebappEntry(
        //   webappEntryEntity.content,
        // );
        // if (webappEntryHash.toString() !== webappPackageVersion.webapp.toString()) {
        //   throw new Error('Hash of received WebappEntry does not match the requested hash.');
        // }

        // 2.2 get UI bytes
        // 2.2.1 get UIEntry
        // TODO fetch the uiEntry first to check for the file size
        // const uiEntryEntity = await this.portalZomeClient.customRemoteCall<Entity<UiEntry>>({
        //   host,
        //   call: {
        //     dna: devhubDnaHash,
        //     zome: 'apphub_csr',
        //     function: 'get_ui_entry',
        //     payload: webappEntryEntity.content.manifest.ui.ui_entry,
        //   },
        // });
        // // 2.2.2 get UI bytes
        // const uiAsset = await this.portalZomeClient.customRemoteCall<UiAsset>({
        //   host,
        //   call: {
        //     dna: devhubDnaHash,
        //     zome: 'apphub_csr',
        //     function: 'get_ui_asset',
        //     payload: webappEntryEntity.content.manifest.ui.ui_entry,
        //   },
        // });
        // 2.3 get happ bundle
        // 2.3.1 get AppEntry
        // 2.3.2 For each role in the manifest, get dna bundle
        // 2.3.2.1 get DnaEntry
        // 2.3.2.2 for zome manifest in integrity and coordinator zomes get Wasm bytes
        // 2.3.2.3 Combine all wasm bytes into bundle via Bundle.createDna() and then call .toBytes()
        // 2.3.3 Create happ bundle with Bundle.createHapp and then .toBytes()
        // 2.4 Create webhapp bundle with Bundle.createWebhapp and then call toBytes()
        // 2.5 verify all hashes with the expected hashes

        // return Promise.reject('fetchWebappBytes() is not implemented yet.');
      },
      {
        dna: appVersion.apphub_hrl.dna,
        zome: 'apphub_csr',
        function: 'get_webapp_package_version_entry', // We just pick one of the functions for the sake of simplicity and assume that all other functions are callable as well by the same host
      },
      4000,
    );
  }

  bundleFromDnaAsset(dnaAsset: DnaAsset): any {
    const manifest = { ...dnaAsset.dna_entry.manifest };

    // Copy objects so the original input is not mutated
    manifest.integrity = { ...manifest.integrity };
    manifest.coordinator = { ...manifest.coordinator };
    manifest.integrity.zomes = manifest.integrity.zomes.slice();
    manifest.coordinator.zomes = manifest.coordinator.zomes.slice();

    // const manifest			= { ...dna_asset.dna_entry.manifest };
    for (const zome in manifest.integrity.zomes) {
      const zome_manifest = (manifest.integrity.zomes[zome] = {
        ...manifest.integrity.zomes[zome],
      });
      delete zome_manifest.zome_hrl;
      const zomeAsset = dnaAsset.zome_assets[zome_manifest.name];
      zome_manifest.bytes = this.mereMemoryZomeClient.decompressBytes(
        zomeAsset.memory_entry,
        zomeAsset.bytes,
      );
    }

    for (const zome in manifest.coordinator.zomes) {
      const zome_manifest = (manifest.coordinator.zomes[zome] = {
        ...manifest.coordinator.zomes[zome],
      });

      delete zome_manifest.zome_hrl;
      const zomeAsset = dnaAsset.zome_assets[zome_manifest.name];
      zome_manifest.bytes = this.mereMemoryZomeClient.decompressBytes(
        zomeAsset.memory_entry,
        zomeAsset.bytes,
      );
    }

    return Bundle.createDna(manifest);
  }

  bundleFromAppAsset(appAsset: AppAsset): any {
    const manifest = { ...appAsset.app_entry.manifest };

    // Copy objects so the original input is not mutated
    manifest.roles = manifest.roles.slice();

    for (const i in manifest.roles) {
      const role_manifest = (manifest.roles[i] = {
        ...manifest.roles[i],
      });
      delete role_manifest.dna.dna_hrl;
      const dna_bundle = this.bundleFromDnaAsset(appAsset.dna_assets[role_manifest.name]);
      role_manifest.dna.bytes = dna_bundle.toBytes();
    }

    return Bundle.createHapp(manifest);
  }

  bundleFromWebappAsset(webappAsset: WebAppAsset): any {
    // Copy objects so the original input is not mutated
    const manifest = { ...webappAsset.webapp_entry.manifest };

    const app_bundle = this.bundleFromAppAsset(webappAsset.app_asset);
    manifest.happ_manifest = {
      bytes: app_bundle.toBytes(),
    };

    manifest.ui = {
      bytes: this.mereMemoryZomeClient.decompressBytes(
        webappAsset.ui_asset.memory_entry,
        webappAsset.ui_asset.bytes,
      ),
    };

    return Bundle.createWebhapp(manifest);
  }
}
