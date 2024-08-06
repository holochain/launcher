/* eslint-disable @typescript-eslint/no-explicit-any */
import { type ActionHash, type AppClient, encodeHashToBase64 } from '@holochain/client';
import { Bundle } from '@spartan-hc/bundles';
import { sha256 } from 'js-sha256';

import type {
  AppAsset,
  DnaAsset,
  Entity,
  UiAsset,
  WebAppAsset,
  WebAppEntry,
  WebAppPackageVersionEntry,
} from '../devhub/types';
import { MereMemoryZomeClient } from '../mere-memory/zomes/mere-memory-zome-client';
import { PortalZomeClient } from '../portal/zomes/portal-zome-client';
import type { AppStoreAllowList, AppStoreDenyList, UpdateEntityInput } from '../types';
import { bundleToDeterministicBytes } from '../utils';
import type {
  AppEntry,
  AppVersionEntry,
  CreateAppFrontendInput,
  CreatePublisherFrontendInput,
  PublisherEntry,
  UpdateAppFrontendInput,
  UpdatePublisherFrontendInput,
} from './types';
import { AppstoreZomeClient } from './zomes/appstore-zome-client';

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
    const iconEntryHash = await this.mereMemoryZomeClient.saveBytes(input.icon);
    return this.appstoreZomeClient.createApp({
      ...input,
      icon: iconEntryHash,
    });
  }

  async updateApp(input: UpdateEntityInput<UpdateAppFrontendInput>): Promise<Entity<AppEntry>> {
    let iconEntryHash;
    if (input.properties.icon) {
      iconEntryHash = await this.mereMemoryZomeClient.saveBytes(input.properties.icon);
    }

    return this.appstoreZomeClient.updateApp({
      base: input.base,
      properties: {
        ...input.properties,
        icon: iconEntryHash ? iconEntryHash : undefined,
      },
    });
  }

  async getAppDetails(actionHash: Uint8Array): Promise<Entity<AppEntry> | undefined> {
    return this.appstoreZomeClient.getApp(actionHash) || undefined;
  }

  /**
   * Checks whether a new update is available for a given AppVersionEntry id
   *
   * An update is considered valid if
   * - the happ sha256 is identical to the happ sha256 of the existing AppVersionEntry
   * - the ui sha256 is different from the ui sha256 of the existing AppVersionEntry
   * - the AppVersionEntry is published later than the current AppVersionEntry
   *
   * @param appVersionId
   * @param allowlist mandatory allowlist by which UI updates are filtered
   * @returns
   */
  async checkForUiUpdate(
    appVersionId: ActionHash,
    allowlist: AppStoreAllowList,
    denyList?: AppStoreDenyList,
  ): Promise<Entity<AppVersionEntry> | undefined> {
    // logic
    // we need to check that there is a new version available and that the happ bundle hash is the same but the ui hash is different
    const appVersionEntity = await this.appstoreZomeClient.getAppVersion(appVersionId);

    if (denyList && denyList.includes(encodeHashToBase64(appVersionEntity.content.for_app))) {
      return undefined;
    }

    const appVersions = await this.appstoreZomeClient.getAppVersionsForApp(
      appVersionEntity.content.for_app,
    );

    const isUpdateCandidate = (entity: Entity<AppVersionEntry>) =>
      entity.content.published_at > appVersionEntity.content.published_at &&
      entity.content.bundle_hashes.happ_hash === appVersionEntity.content.bundle_hashes.happ_hash &&
      entity.content.bundle_hashes.ui_hash !== appVersionEntity.content.bundle_hashes.ui_hash;

    const appEntryList = allowlist[encodeHashToBase64(appVersionEntity.content.for_app)];
    const isAllowedVersion = (entity: Entity<AppVersionEntry>) =>
      !appEntryList ||
      appEntryList.appVersions === 'all' ||
      appEntryList.appVersions.includes(encodeHashToBase64(entity.action));

    const updateCandidates = appVersions
      .filter(isUpdateCandidate)
      .filter(isAllowedVersion)
      .sort((a, b) => b.content.published_at - a.content.published_at);

    if (updateCandidates.length > 0) return updateCandidates[0];
    return undefined;
  }

  // async fetchHappBytes();

  /**
   * Fetches the webhapp bytes for a given app version via sequential remote calls to devhub hosts
   * @param appVersion
   */
  async fetchWebappBytes(appVersion: AppVersionEntry): Promise<Uint8Array> {
    // For simplicity make all calls with one host. If that proves to not work well, split into
    // separate calls to different hosts
    return this.portalZomeClient.tryWithHosts<Uint8Array>({
      fn: async (host) => {
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
        if (
          encodeHashToBase64(webappPackageVersionEntryHash) !==
          encodeHashToBase64(appVersion.apphub_hrl_hash)
        ) {
          throw new Error(
            `Hash of received WebappPackageVersionEntry does not match expected hash. Got ${encodeHashToBase64(webappPackageVersionEntryHash)}, expected ${encodeHashToBase64(appVersion.apphub_hrl_hash)}`,
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

        // Create webapp bundle
        const webappBundle = this.bundleFromWebappAsset(webappAsset);
        const deterministicBundleBytes = bundleToDeterministicBytes(webappBundle);

        const webappSha256 = sha256.hex(deterministicBundleBytes);
        if (appVersion.bundle_hashes.hash !== webappSha256)
          throw new Error(
            `Hash of received webhapp bytes does not match the expected hash. Got ${webappSha256} but expecting ${appVersion.bundle_hashes.hash}`,
          );

        return deterministicBundleBytes;

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
      dnaZomeFunction: {
        dna: appVersion.apphub_hrl.dna,
        zome: 'apphub_csr',
        function: 'get_webapp_package_version_entry', // We just pick one of the functions for the sake of simplicity and assume that all other functions are callable as well by the same host
      },
      pingTimeout: 4000,
    });
  }

  /**
   *
   * @param appVersion
   * @param webappPackageVersion Can be provided if the WebAppPackageVersionEntry has already been fetched
   * otherwise in order to omit redundant remote calls
   * @returns
   */
  async fetchHappBytes(
    appVersion: AppVersionEntry,
    webappPackageVersion?: WebAppPackageVersionEntry,
  ): Promise<Uint8Array> {
    // For simplicity make all calls with one host. If that proves to not work well, split into
    // separate calls to different hosts
    return this.portalZomeClient.tryWithHosts<Uint8Array>({
      fn: async (host) => {
        // 1. get WebappPackageVersion and verify its hash - only necessary if the entry is not already
        // provided as a function argument.
        if (!webappPackageVersion) {
          webappPackageVersion =
            await this.portalZomeClient.customRemoteCall<WebAppPackageVersionEntry>({
              host,
              call: {
                dna: appVersion.apphub_hrl.dna,
                zome: 'apphub_csr',
                function: 'get_webapp_package_version_entry',
                payload: appVersion.apphub_hrl.target,
              },
            });

          console.log('Got webapp package version: ', webappPackageVersion);
        }
        // validate hash of received entry
        const webappPackageVersionEntryHash =
          await this.appstoreZomeClient.hashWebappPackageVersionEntry(webappPackageVersion);
        if (
          encodeHashToBase64(webappPackageVersionEntryHash) !==
          encodeHashToBase64(appVersion.apphub_hrl_hash)
        ) {
          throw new Error(
            `Hash of WebappPackageVersionEntry does not match expected hash. Got ${encodeHashToBase64(webappPackageVersionEntryHash)}, expected ${encodeHashToBase64(appVersion.apphub_hrl_hash)}`,
          );
        }
        // 2. Get happ bundle
        // happy path
        const appAsset = await this.portalZomeClient.customRemoteCall<AppAsset>({
          host,
          call: {
            dna: appVersion.apphub_hrl.dna,
            zome: 'apphub_csr',
            function: 'get_app_asset',
            payload: webappPackageVersion.webapp,
          },
        });

        console.log('Got AppAsset: ', appAsset);

        // Create webapp bundle
        const appBundle = this.bundleFromAppAsset(appAsset);
        const deterministicBundleBytes = bundleToDeterministicBytes(appBundle);

        const happSha256 = sha256.hex(deterministicBundleBytes);
        if (appVersion.bundle_hashes.happ_hash !== happSha256)
          throw new Error(
            `Hash of received happ bytes does not match the expected hash. Got ${happSha256} but expecting ${appVersion.bundle_hashes.happ_hash}`,
          );

        return deterministicBundleBytes;
      },
      dnaZomeFunction: {
        dna: appVersion.apphub_hrl.dna,
        zome: 'apphub_csr',
        function: 'get_app_asset', // We just pick one of the functions for the sake of simplicity and assume that all other functions are callable as well by the same host
      },
      pingTimeout: 4000,
    });
  }

  /**
   * Fetches the UI bytes for a given app version
   * @param appVersion
   */
  async fetchUiBytes(appVersion: AppVersionEntry): Promise<Uint8Array> {
    // For simplicity make all calls with one host. If that proves to not work well, split into
    // separate calls to different hosts
    return this.portalZomeClient.tryWithHosts<Uint8Array>({
      fn: async (host) => {
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
        const uiResourcePath = webappEntryEntity.content.manifest.ui.bundled;
        const uiEntryHash = webappEntryEntity.content.resources[uiResourcePath];
        if (!uiEntryHash)
          throw new Error('UI EntryHash not found in the resources field of the WebAppEntry');

        // happy path
        const uiAsset = await this.portalZomeClient.customRemoteCall<UiAsset>({
          host,
          call: {
            dna: appVersion.apphub_hrl.dna,
            zome: 'apphub_csr',
            function: 'get_ui_asset',
            payload: uiEntryHash,
          },
        });

        console.log('Got uiAsset: ', uiAsset);

        const bytes = this.mereMemoryZomeClient.decompressBytes(
          uiAsset.memory_entry,
          uiAsset.bytes,
        );

        // Verify integrity of bytes
        const uiSha256 = sha256.hex(bytes);
        if (appVersion.bundle_hashes.ui_hash !== uiSha256)
          throw new Error(
            `Hash of received UI bytes does not match the expected hash. Got ${uiSha256} but expecting ${appVersion.bundle_hashes.ui_hash}`,
          );

        return bytes;
      },
      dnaZomeFunction: {
        dna: appVersion.apphub_hrl.dna,
        zome: 'apphub_csr',
        function: 'get_webapp_package_version_entry', // We just pick one of the functions for the sake of simplicity and assume that all other functions are callable as well by the same host
      },
      pingTimeout: 4000,
    });
  }

  bundleFromDnaAsset(dnaAsset: DnaAsset): any {
    const manifest = dnaAsset.dna_entry.manifest;
    const resources = {};

    for (const zomeManifest of manifest.integrity.zomes) {
      const rpath = zomeManifest.bundled;
      const zomeAsset = dnaAsset.zome_assets[zomeManifest.name];
      resources[rpath] = this.mereMemoryZomeClient.decompressBytes(
        zomeAsset.memory_entry,
        zomeAsset.bytes,
      );
    }

    for (const zome_manifest of manifest.coordinator.zomes) {
      const rpath = zome_manifest.bundled;
      const zomeAsset = dnaAsset.zome_assets[zome_manifest.name];
      console.log('decompressing zome bytes for zomeAsset: ', zomeAsset);
      resources[rpath] = this.mereMemoryZomeClient.decompressBytes(
        zomeAsset.memory_entry,
        zomeAsset.bytes,
      );
    }

    return new Bundle(
      {
        manifest: {
          manifest_version: '1',
          ...manifest,
        },
        resources,
      },
      'dna',
    );
  }

  bundleFromAppAsset(appAsset: AppAsset): any {
    const manifest = appAsset.app_entry.manifest;
    const resources = {};

    for (const role_manifest of manifest.roles) {
      const rpath = role_manifest.dna.bundled;
      const dna_bundle = this.bundleFromDnaAsset(appAsset.dna_assets[role_manifest.name]);
      resources[rpath] = dna_bundle.toBytes();
    }

    return new Bundle(
      {
        manifest: {
          manifest_version: '1',
          ...manifest,
        },
        resources,
      },
      'happ',
    );
  }

  bundleFromWebappAsset(webappAsset: WebAppAsset): any {
    const manifest = webappAsset.webapp_entry.manifest;
    const resources = {};

    console.log('Creating bundle from app assset...');
    {
      const app_bundle = this.bundleFromAppAsset(webappAsset.app_asset);
      const rpath = manifest.happ_manifest.bundled;
      resources[rpath] = app_bundle.toBytes();
    }

    console.log('Decompressing UI bytes...');
    {
      const rpath = manifest.ui.bundled;
      resources[rpath] = this.mereMemoryZomeClient.decompressBytes(
        webappAsset.ui_asset.memory_entry,
        webappAsset.ui_asset.bytes,
      );
    }

    return new Bundle(
      {
        manifest: {
          manifest_version: '1',
          ...manifest,
        },
        resources,
      },
      'webhapp',
    );
  }
}
