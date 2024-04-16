import type { ActionHash, AgentPubKey, AppAgentCallZomeRequest } from '@holochain/client';

import type { Entity, UpdateEntityInput } from '../../devhub/types';
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
    return this.callZome('get_app_version', actionHash);
  }

  async getAppVersionsForApp(actionHash: ActionHash): Promise<Array<Entity<AppVersionEntry>>> {
    return this.callZome('get_app_versions_for_app', actionHash);
  }

  protected callZome(fn_name: string, payload: unknown) {
    const req: AppAgentCallZomeRequest = {
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name,
      payload,
    };
    return this.client.callZome(req);
  }
}
