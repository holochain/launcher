/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  ActionHash,
  AgentPubKey,
  DnaHash,
  EntryHash,
  ZomeCallCapGrant,
} from '@holochain/client';

import type { EntityId, HRL } from '../devhub/types';

export type AppEntry = {
  title: string;
  subtitle: string;
  description: string;
  icon: EntryHash;
  publisher: EntityId;
  apphub_hrl: HRL;
  apphub_hrl_hash: EntryHash;

  editors: Array<AgentPubKey>;
  published_at?: number;
  last_updated?: number;
  metadata?: any;

  deprecation?: DeprecationNotice;
};

export type CreateAppFrontendInput = {
  title: string;
  subtitle: string;
  description: string;
  icon: Uint8Array; // icon bytes
  publisher: EntityId;
  apphub_hrl: HRL;
  apphub_hrl_hash: EntryHash;

  editors?: Array<AgentPubKey>;

  published_at?: number;
  last_updated?: number;
  metadata?: any;
};

export type CreateAppInput = {
  title: string;
  subtitle: string;
  description: string;
  icon: EntryHash;
  publisher: EntityId;
  apphub_hrl: HRL;
  apphub_hrl_hash: EntryHash;

  editors?: Array<AgentPubKey>;

  published_at?: number;
  last_updated?: number;
  metadata?: any;
};

export type UpdateAppProperties = {
  title?: string;
  subtitle?: string;
  description?: string;
  icon?: EntryHash;
  apphub_hrl?: HRL;
  apphub_hrl_hash?: EntryHash;

  editors?: Array<AgentPubKey>;

  published_at?: number;
  last_updated?: number;
  metadata?: any;
};

export type UpdateAppFrontendInput = {
  title?: string;
  subtitle?: string;
  description?: string;
  icon?: Uint8Array; // icon bytes
  apphub_hrl?: HRL;
  apphub_hrl_hash?: EntryHash;

  editors?: Array<AgentPubKey>;

  published_at?: number;
  last_updated?: number;
  metadata?: any;
};

export type AppVersionEntry = {
  version: string;
  for_app: EntityId;
  /**
   * HRL to WebappPackageVersion record in devhub where the target being ist action hash (EntityId)
   */
  apphub_hrl: HRL;
  /**
   * Entry hash (EntityAddress) of the WebappPackageVersion entry in devhub
   */
  apphub_hrl_hash: EntryHash;
  bundle_hashes: BundleHashes;

  // common fields
  author: AgentPubKey;
  published_at: number;
  last_updated: number;
  metadata: any;
};

export type CreateAppVersionInput = {
  version: string;
  for_app: EntityId;
  apphub_hrl: HRL;
  /**
   * Entry hash (EntityAddress) of the WebappPackageVersion entry in devhub
   */
  apphub_hrl_hash: EntryHash;
  bundle_hashes: BundleHashes;

  // common fields
  published_at?: number;
  last_updated?: number;
  metadata?: any;
};

export type PublisherEntry = {
  name: string;
  location: string;
  website: WebAddress;
  icon: EntryHash;
  editors: Array<AgentPubKey>;

  author: AgentPubKey;
  published_at: number | undefined;
  last_updated: number | undefined;
  metadata: any;

  description: string | undefined;
  email: string | undefined;
  deprecation: DeprecationNotice | undefined;
};

export type CreatePublisherInput = {
  name: string;
  location: string;
  website: WebAddress;

  description?: string;
  email?: string;
  icon: EntryHash | undefined;
  editors?: Array<AgentPubKey>;

  published_at?: number;
  last_updated?: number;
  metadata?: any;
};

export type CreatePublisherFrontendInput = {
  name: string;
  location: string;
  website: WebAddress;
  icon: Uint8Array;

  description?: string;
  email?: string;
  editors?: Array<AgentPubKey>;

  published_at?: number;
  last_updated?: number;
  metadata?: any;
};

export type UpdatePublisherFrontendInput = {
  name?: string;
  location?: string;
  website?: WebAddress;
  icon?: Uint8Array;

  description?: string | undefined;
  email?: string | undefined;
  editors?: Array<AgentPubKey> | undefined;

  // TODO figure out whether that's really intentional that this is updateable
  // publishedAt?: number | undefined;
  last_updated?: number | undefined;
  metadata?: any;
};

export type UpdatePublisherInput = {
  name?: string;
  location?: string;
  website?: WebAddress;
  icon?: EntryHash;

  description?: string | undefined;
  email?: string | undefined;
  editors?: Array<AgentPubKey> | undefined;

  // TODO figure out whether that's really intentional that this is updateable
  // publishedAt?: number | undefined;
  last_updated?: number | undefined;
  metadata?: any;
};

export type DeprecateInput = {
  base: ActionHash;
  message: string;
};

export type UndeprecateInput = {
  base: ActionHash;
};

export type WebAddress = {
  url: string;
  context: string | undefined;
};

export type DeprecationNotice = {
  message: string;
  recommended_alternatives: Array<ActionHash>;
};

export type BundleHashes = {
  hash: string;
  ui_hash: string;
  happ_hash: string;
};

export interface HostEntry {
  dna: DnaHash;
  capabilities: ZomeCallCapGrant;
  author: AgentPubKey;
  published_at: number;
  last_updated: number;
  metadata: any;
}

export interface HostAvailability {
  responded: AgentPubKey[];
  totalHosts: number;
  pingTimestamp: number;
}

export interface CustomRemoteCallInput {
  host: AgentPubKey;
  call: RemoteCallInput;
}

export interface RemoteCallInput {
  dna: DnaHash;
  zome: string;
  function: string;
  payload: any;
}

export interface DevHubResponse<T> {
  type: 'success' | 'failure';
  metadata: any;
  payload: T;
}
