import type { ActionHash, AgentPubKey, AppCallZomeRequest, EntryHash } from '@holochain/client';

import type {
  DevhubAppEntry,
  Entity,
  UiEntry,
  WebAppEntry,
  WebAppPackageVersionEntry,
} from '../../devhub/types';
import type { UpdateEntityInput } from '../../types';
import { ZomeClient } from '../../zome-client/zome-client';
import type {
  AppEntry,
  AppVersionEntry,
  CreateAppInput,
  CreateAppVersionInput,
  CreatePublisherInput,
  DeprecateInput,
  PublisherEntry,
  UndeprecateInput,
  UpdateAppProperties,
  UpdatePublisherInput,
} from '../types';

export class AppstoreZomeClient extends ZomeClient {
  //
  // Publisher
  //

  async createPublisher(input: CreatePublisherInput): Promise<Entity<PublisherEntry>> {
    return this.callZome('create_publisher', input);
  }

  async getPublisher(actionHash: ActionHash): Promise<Entity<PublisherEntry>> {
    return this.callZome('get_publisher', { id: actionHash });
  }

  async getPublishersForAgent(agentPubKey: AgentPubKey): Promise<Array<PublisherEntry>> {
    return this.callZome('get_publishers_for_agent', { forAgent: agentPubKey });
  }

  async getMyPublishers(): Promise<Array<Entity<PublisherEntry>>> {
    return this.callZome('get_my_publishers', null);
  }

  async getAllPublishers(): Promise<Array<PublisherEntry>> {
    return this.callZome('get_all_publishers', null);
  }

  async updatePublisher(
    input: UpdateEntityInput<UpdatePublisherInput>,
  ): Promise<Entity<PublisherEntry>> {
    return this.callZome('update_publisher', input);
  }

  async deprecatePublisher(input: DeprecateInput): Promise<Entity<PublisherEntry>> {
    return this.callZome('deprecate_publisher', input);
  }

  async unDeprecatePublisher(input: UndeprecateInput): Promise<Entity<PublisherEntry>> {
    return this.callZome('undeprecate_publisher', input);
  }

  //
  // App
  //

  async createApp(input: CreateAppInput): Promise<Entity<AppEntry>> {
    return this.callZome('create_app', input);
  }

  async updateApp(input: UpdateEntityInput<UpdateAppProperties>): Promise<Entity<AppEntry>> {
    return this.callZome('create_app', input);
  }

  async getApp(actionHash: ActionHash): Promise<Entity<AppEntry>> {
    return this.callZome('get_app', { id: actionHash });
  }

  async getAppsForAgent(agentPubKey: AgentPubKey): Promise<Array<Entity<AppEntry>>> {
    return this.callZome('get_apps_for_agent', { forAgent: agentPubKey });
  }

  async getMyApps(): Promise<Array<Entity<AppEntry>>> {
    return this.callZome('get_my_apps', null);
  }

  async getAllApps(): Promise<Array<Entity<AppEntry>>> {
    return this.callZome('get_all_apps', null);
  }

  async createAppVersion(input: CreateAppVersionInput): Promise<Entity<AppVersionEntry>> {
    return this.callZome('create_app_version', input);
  }

  async getAppVersion(actionHash: ActionHash): Promise<Entity<AppVersionEntry>> {
    return this.callZome('get_app_version', { id: actionHash });
  }

  async getAppVersionsForApp(actionHash: ActionHash): Promise<Array<Entity<AppVersionEntry>>> {
    return this.callZome('get_app_versions_for_app', { for_app: actionHash });
  }

  //
  // Hashing of entries
  //
  async hashWebappPackageVersionEntry(input: WebAppPackageVersionEntry): Promise<EntryHash> {
    return this.callZome('hash_webapp_package_version_entry', input);
  }

  async hashWebappEntry(input: WebAppEntry): Promise<EntryHash> {
    return this.callZome('hash_webapp_entry', input);
  }

  async hashAppEntry(input: DevhubAppEntry): Promise<EntryHash> {
    return this.callZome('hash_app_entry', input);
  }

  async hashUiEntry(input: UiEntry): Promise<EntryHash> {
    return this.callZome('hash_ui_entry', input);
  }

  // async verifyWebappAsset(webappAsset: WebAppAsset, expectedHash: EntryHash): Promise<void> {
  //   // We recursively check that all hashes match, starting with the hash of the WebAppEntry
  //   const webappEntryHash = await this.hashWebappEntry(webappAsset.webapp_entry);
  //   if (webappEntryHash.toString() !== expectedHash.toString())
  //     throw new Error('WebAppEntry hash is invalid.');
  //   // verify AppAsset
  //   await this.verifyAppAsset(
  //     webappAsset.app_asset,
  //     webappAsset.webapp_entry.manifest.happ_manifest.appEntry,
  //   );
  //   // verify UiAsset
  //   await this.verifyUiAsset(webappAsset.ui_asset, webappAsset.webapp_entry.manifest.ui.ui_entry);
  // }

  // async verifyUiAsset(uiAsset: UiAsset, expectedHash: EntryHash): Promise<void> {
  //   const uiEntryHash = await this.hashUiEntry(uiAsset.ui_entry);
  //   if (uiEntryHash.toString() !== expectedHash.toString())
  //     throw new Error('UiEntry hash is invalid.');

  //   uiAsset.ui_entry.mere_memory_addr
  // }

  // async verifyAppAsset(appAsset: AppAsset, expectedHash: EntryHash): Promise<void> {
  //   const appEntryHash = this.hashAppEntry(appAsset.app_entry);
  //   if (appEntryHash.toString() !== expectedHash.toString())
  //     throw new Error('AppEntry hash is invalid.');

  //   if (appAsset.app_entry.manifest.roles.length !== Object.keys(appAsset.dna_assets).length)
  //     throw new Error('Wrong number of dna assets.');

  //   // verify DnaAssets
  //   for (const role of appAsset.app_entry.manifest.roles) {
  //     const expectedDnaEntryHash = role.dna.dna_hrl.target;
  //     await this.verifyDnaAsset(appAsset.dna_assets[role.name], expectedDnaEntryHash);
  //   }
  // }

  // async verifyDnaAsset(dnaAsset: DnaAsset, expectedHash: EntryHash): Promise<void> {
  //   const dnaEntrHash = this.hash;
  // }

  protected callZome(fn_name: string, payload: unknown) {
    const req: AppCallZomeRequest = {
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name,
      payload,
    };
    return this.client.callZome(req);
  }
}
