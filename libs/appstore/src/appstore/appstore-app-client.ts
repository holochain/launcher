/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AppAgentClient } from '@holochain/client';

import type { Entity, UpdateEntityInput } from '../devhub/types';
import { MereMemoryZomeClient } from '../mere-memory/zomes/mere-memory-zome-client';
import type {
  AppEntry,
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

  constructor(public client: AppAgentClient) {
    this.mereMemoryZomeClient = new MereMemoryZomeClient(client, 'mere_memory', 'mere_memory_api');
    this.appstoreZomeClient = new AppstoreZomeClient(client, 'appstore', 'appstore_csr');
    this.portalZomeClient = new PortalZomeClient(client, 'portal', 'portal_csr');
  }

  async createPublisher(input: CreatePublisherFrontendInput): Promise<Entity<PublisherEntry>> {
    const iconAddress = await this.mereMemoryZomeClient.saveBytes(input.icon);
    input.icon = iconAddress;
    return this.appstoreZomeClient.createPublisher(input);
  }

  async updatePublisher(
    input: UpdateEntityInput<UpdatePublisherFrontendInput>,
  ): Promise<Entity<PublisherEntry>> {
    if (input.properties.icon) {
      const iconAddress = await this.mereMemoryZomeClient.saveBytes(input.properties.icon);
      input.properties.icon = iconAddress;
    }
    return this.appstoreZomeClient.updatePublisher(input);
  }

  async createApp(input: CreateAppFrontendInput): Promise<Entity<AppEntry>> {
    const iconAddress = await this.mereMemoryZomeClient.saveBytes(input.icon);
    input.icon = iconAddress;
    return this.appstoreZomeClient.createApp(input);
  }
}
