/* eslint-disable @typescript-eslint/no-explicit-any */

import type {
  ActionHash,
  AnyDhtHash,
  DnaHash,
  DnaHashB64,
  EntryHash,
  WasmHashB64,
  ZomeName,
} from '@holochain/client';

import { type DeprecationNotice } from '../appstore';
import type { MemoryEntry } from '../mere-memory';

export type DevhubAppEntry = {
  manifest: AppManifestV1;
  app_token: AppToken;
};

export type CreateDevhubAppInput = {
  manifest: AppManifestV1;
  roles_dna_tokens: RolesDnaTokensInput;
  claimed_file_size: number;
};

export type DevhubAppEntryInput = {
  manifest: AppManifestV1;
  appToken: AppTokenInput;
};

export type AppAsset = {
  app_entry: DevhubAppEntry;
  dna_assets: Record<RoleName, DnaAsset>;
};

export type AppToken = {
  integrity_hash: Uint8Array;
  roles_token_hash: Uint8Array;
  roles_token: RolesToken;
};

export type AppTokenInput = {
  integrity_hash: Uint8Array;
  roles_token_hash: Uint8Array;
  roles_token: RolesTokenInput;
};

export type RolesToken = Array<[string, RoleToken]>;

export type RolesTokenInput = Array<[string, RoleTokenInput]>;

export type RoleToken = {
  integrity_hash: Uint8Array;
  integrities_token_tash: Uint8Array;
  coordinators_token_hash: Uint8Array;
  modifiers_hash: Uint8Array;
};

export type RoleTokenInput = {
  integrity_hash: Uint8Array;
  integrities_token_hash: Uint8Array;
  coordinators_token_hash: Uint8Array;
  modifiersHash: Uint8Array;
};

export type RolesDnaTokensInput = Record<string, DnaTokenInput>;

export type DnaTokenInput = {
  integrity_hash: Uint8Array;
  integrities_token_hash: Uint8Array;
  coordinators_token_hash: Uint8Array;
};

export type AppManifestV1 = {
  name: string;
  description: string | undefined;
  roles: Array<AppRoleManifest>;
};

export type AppRoleManifest = {
  name: RoleName;
  provisioning: any;
  dna: AppRoleDnaManifest;
};

export type AppRoleDnaManifest = {
  dna_hrl?: HRL;
  bytes?: Uint8Array;
  modifiers: any;
  installed_hash: DnaHashB64 | undefined;
  clone_limit: number;
};

export type AppManifestV1WithBytes = {
  name: string;
  description: string | undefined;
  roles: Array<AppRoleManifestWithBytes>;
};

export type AppRoleManifestWithBytes = {
  name: RoleName;
  provisioning: any;
  dna: AppRoleDnaManifest;
};

export type AppRoleDnaManifestWithBytes = {
  bytes: Uint8Array;
  modifiers: any;
  installed_hash: DnaHashB64 | undefined;
  clone_limit: number;
};

export type RoleName = string;

export type Ui = {
  mere_memory_addr: EntryHash;
  file_size: number;
  bytes: Uint8Array;
};

export type UiEntry = {
  mere_memory_addr: EntryHash;
  file_size: number;
};

export type UiAsset = {
  ui_entry: UiEntry;
  memory_entry: MemoryEntry;
  bytes: Uint8Array;
};

export type CreateUiEntryInput = {
  mere_memory_addr: EntryHash;
};

export type CreateLinkWebAppPackageVersionInput = {
  version: string;
  webapp_package_id: EntityId;
  webapp_package_version_addr: ActionHash;
};

export type DeleteLinkWebAppPackageVersionInput = {
  version: string;
  webapp_package_id: EntityId;
};

export type WebAppPackageEntry = {
  title: string;
  subtitle: string;
  description: string;
  maintainer: any; // enum Authority with variant Agent(AgentPubKey)
  icon: MemoryAddr;
  source_code_uri: string | undefined;
  deprecation: DeprecationNotice | undefined;
  metadata: any;
};

export type WebAppPackageEntryInput = {
  title: string;
  subtitle: string;
  description: string;
  maintainer: any; // enum Authority with variant Agent(AgentPubKey)
  icon: MemoryAddr;
  source_code_uri: string | undefined;
  deprecation: DeprecationNotice | undefined;
  metadata: any;
};

export type CreateWebAppPackageFrontendInput = {
  title: string;
  subtitle: string;
  description: string;
  icon: Uint8Array;
  metadata?: any;
  maintainer?: any; // enum Authority with variant Agent(AgentPubKey)
  source_code_uri?: string;
};

export type CreateWebAppPackageInput = {
  title: string;
  subtitle: string;
  description: string;
  icon: MemoryAddr;
  metadata?: any;
  maintainer?: any; // enum Authority with variant Agent(AgentPubKey)
  source_code_uri?: string;
};

export type UpdateWebAppPackageInput = {
  title?: string;
  subtitle?: string;
  description?: string;
  icon?: MemoryAddr;
  maintainer?: any;
  source_code_uri?: string;
  deprecation?: DeprecationNotice;
  metadata?: any;
};

export type WebAppPackageVersionMap = EntityMap<WebAppPackageVersionEntry>;

export type WebAppPackageVersionEntry = {
  for_package: EntityId;
  maintainer: any;
  webapp: BundleAddr;
  webapp_token: WebAppToken;
  changelog: string | undefined;
  source_code_revision_uri: string | undefined;
  metadata: any;
};

export type WebAppPackageVersionEntryInput = WebAppPackageVersionEntry;

export type CreateWebAppPackageVersionInput = {
  for_package: EntityId;
  version: string;
  webapp: BundleAddr;
  metadata?: any;
  changelog?: string;
  maintainer?: any;
  source_code_revision_uri?: string;
};

export type UpdateWebAppPackageVersionInput = {
  for_package?: EntityId;
  changelog?: string;
  maintainer?: any;
  source_code_revision_uri?: string;
  metadata?: any;
};

export type MoveWebAppPackageVersionInput = {
  version: string;
  webapp_package_version_id: ActionHash;
  webapp_package_ids: MoveLinkInput<ActionHash>;
};

export type CreateWebAppInput = {
  manifest: WebAppManifestV1;
};

export type WebAppEntry = {
  manifest: WebAppManifestV1;
  webapp_token: WebAppToken;
};

export type WebAppEntryInput = {
  manifest: WebAppManifestV1;
  webapp_token: WebAppTokenInput;
};

export type WebAppAsset = {
  webapp_entry: WebAppEntry;
  app_asset: AppAsset;
  ui_asset: UiAsset;
};

export type WebAppManifestV1 = {
  name: string;
  ui: WebUI;
  happ_manifest: AppManifestLocation | { bytes: Uint8Array };
};

export type WebUI =
  | {
      ui_entry: EntryHash;
    }
  | { bytes: Uint8Array };

export type AppManifestLocation = {
  app_entry: EntryHash;
};

export type WebAppToken = {
  ui_hash: Uint8Array;
  app_token: AppToken;
};

export type WebAppTokenInput = {
  ui_hash: Uint8Array;
  app_token: AppTokenInput;
};

export type MemoryAddr = EntryHash;

export type Entity<T> = {
  /// The address of the original create action
  id: EntityId;

  /// The create/update action of the current entry
  action: ActionHash;

  /// The address of the current entry
  address: EntryHash;

  /// An identifier for the content's type and structure
  ctype: string;

  /// The entity's current value
  content: T;
};

export type EntityId = ActionHash;

export type EntityMap<T> = Record<string, Entity<T>>;

export type UpdateEntityInput<T> = {
  base: ActionHash;
  properties: T;
};

export type BundleAddr = EntryHash;

// ZOME HUB

export type ZomeEntry = {
  zome_type: ZomeType;
  mere_memory_addr: EntryHash;
  file_size: number;
  hash: string;
};

export type Zome = {
  zome_type: ZomeType;
  mere_memory_addr: EntryHash;
  file_size: number;
  hash: string;
  bytes: Uint8Array;
};

export type CreateZomeEntryInput = {
  zome_type: ZomeType;
  mere_memory_addr: EntryHash;
};

export enum ZomeType {
  Integrity = 'integrity',
  Coordinator = 'coordinator',
}

// DNA HUB

export type DnaEntry = {
  manifest: DnaManifestV1;
  dna_token: DnaToken;
  integrities_token: IntegritiesToken;
  coordinators_token: CoordinatorsToken;
};

export type DnaEntryInput = {
  manifest: DnaManifestV1;
  dnaToken: DnaToken;
  integrities_token: IntegritiesTokenInput;
  coordinators_token: CoordinatorsTokenInput;
};

export type DnaAsset = {
  dna_entry: DnaEntry;
  zome_assets: ZomeAssetMap;
};

export type ZomeAssetMap = Record<ZomeName, ZomeAsset>;

export type ZomeAsset = {
  zome_entry: ZomeEntry;
  memory_entry: MemoryEntry;
  bytes: Uint8Array;
};

export type IntegritiesToken = Array<[string, Uint8Array]>;
export type CoordinatorsToken = Array<[string, Uint8Array]>;

export type IntegritiesTokenInput = Array<[string, Uint8Array]>;
export type CoordinatorsTokenInput = Array<[string, Uint8Array]>;

export type CreateDnaInput = {
  manifest: DnaManifestV1;
  claimed_file_size: number;
  asset_hashes: DnaAssetHashes;
};

export type DnaAssetHashes = {
  integrity: AssetHashes;
  coordinator: AssetHashes;
};

export type AssetHashes = Record<string, string>;

export type DnaManifestV1 = {
  name: string;
  integrity: IntegrityManifest;
  coordinator: CoordinatorManifest;
};

export type IntegrityManifest = {
  network_seed: string | undefined;
  properties: any | undefined;
  origin_time: any;
  zomes: Array<IntegrityZomeManifest>;
};

export type CoordinatorManifest = {
  zomes: Array<CoordinatorZomeManifest>;
};

export type IntegrityZomeManifest = {
  name: ZomeName;
  hash: WasmHashB64 | undefined;
  zome_hrl?: HRL;
  bytes?: Uint8Array;
  dylib: any;
};

export type IntegrityZomeManifestWithBytes = {
  name: ZomeName;
  hash: WasmHashB64 | undefined;
  bytes: Uint8Array;
  dylib: any;
};

export type CoordinatorZomeManifest = {
  name: ZomeName;
  hash: WasmHashB64 | undefined;
  zome_hrl?: HRL;
  bytes?: Uint8Array;
  dependencies: Array<ZomeDependency> | undefined;
  dylib: any;
};

export type CoordinatorZomeManifestWithBytes = {
  name: ZomeName;
  hash: WasmHashB64 | undefined;
  bytes: Uint8Array;
  dependencies: Array<ZomeDependency> | undefined;
  dylib: any;
};

export type ZomeDependency = {
  name: ZomeName;
};

export type DnaToken = {
  integrity_hash: Uint8Array;
  integrities_token_hash: Uint8Array;
  coordinators_token_hash: Uint8Array;
};

export type HRL = {
  dna: DnaHash;
  target: AnyDhtHash;
};

export type MoveLinkInput<T> = {
  from: T;
  to: T;
};
