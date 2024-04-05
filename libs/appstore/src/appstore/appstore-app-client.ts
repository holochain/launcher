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
}
