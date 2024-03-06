/* eslint-disable @typescript-eslint/no-explicit-any */

import type {
	ActionHash,
	AnyDhtHash,
	DnaHash,
	EntryHash,
	WasmHashB64,
	ZomeName
} from '@holochain/client';

export type AppEntry = {
	manifest: AppManifestV1;
	appToken: AppToken;
};

export type CreateAppInput = {
	manifest: AppManifestV1;
	rolesDnaTokens: RolesDnaTokensInput;
};

export type AppEntryInput = {
	manifest: AppManifestV1;
	appToken: AppTokenInput;
};

export type AppToken = {
	integrityHash: Uint8Array;
	rolesTokenHash: Uint8Array;
	rolesToekn: RolesToken;
};

export type AppTokenInput = {
	integrityHash: Uint8Array;
	rolesTokenHash: Uint8Array;
	rolesToken: RolesTokenInput;
};

export type RolesToken = Array<[string, RoleToken]>;

export type RolesTokenInput = Array<[string, RoleTokenInput]>;

export type RoleToken = {
	integrityHash: Uint8Array;
	integritiesTokenHash: Uint8Array;
	coordinatorsTokenHash: Uint8Array;
	modifiersHash: Uint8Array;
};

export type RoleTokenInput = {
	integrityHash: Uint8Array;
	integritiesTokenHash: Uint8Array;
	coordinatorsTokenHash: Uint8Array;
	modifiersHash: Uint8Array;
};

export type RolesDnaTokensInput = Record<string, DnaTokenInput>;

export type DnaTokenInput = {
	integrityHash: Uint8Array;
	integritiesTokenHash: Uint8Array;
	coordinatorsTokenHash: Uint8Array;
};

export type AppManifestV1 = {
	name: string;
	description: string | undefined;
	roles: Array<AppRoleManifest>;
};

export type AppRoleManifest = {
	name: RoleName;
	provisioning: any;
	dna: any;
};

export type RoleName = string;

export type Ui = {
	mereMemoryAddr: EntryHash;
	fileSize: number;
	bytes: Uint8Array;
};

export type UiEntry = {
	mereMemoryAddr: EntryHash;
	fileSize: number;
};

export type CreateUiEntryInput = {
	mereMemoryAddr: EntryHash;
};

export type WebAppPackageEntry = {
	title: string;
	subtitle: string;
	description: string;
	maintainer: any; // enum Authority with variant Agent(AgentPubKey)
	icon: MemoryAddr;
	sourceCodeUri: string | undefined;
	deprecation: DeprecationNotice | undefined;
	metadata: any;
};

export type WebAppPackageEntryInput = {
	title: string;
	subtitle: string;
	description: string;
	maintainer: any; // enum Authority with variant Agent(AgentPubKey)
	icon: MemoryAddr;
	sourceCodeUri: string | undefined;
	deprecation: DeprecationNotice | undefined;
	metadata: any;
};

export type CreateWebAppPackageFrontendInput = {
	title: string;
	subtitle: string;
	description: string;
	icon: Uint8Array;
	metadata: any;
	maintainer: any; // enum Authority with variant Agent(AgentPubKey)
	sourceCodeUri: string | undefined;
};

export type CreateWebAppPackageInput = {
	title: string;
	subtitle: string;
	description: string;
	icon: MemoryAddr;
	metadata: any;
	maintainer: any; // enum Authority with variant Agent(AgentPubKey)
	sourceCodeUri: string | undefined;
};

export type UpdateWebAppPackageInput = {
	title?: string;
	subtitle?: string;
	description?: string;
	icon?: MemoryAddr;
	maintainer?: any;
	sourceCodeUri?: string;
	deprecation?: DeprecationNotice;
	metadata?: any;
};

export type WebAppPackageVersionMap = EntityMap<WebAppPackageVersionEntry>;

export type WebAppPackageVersionEntry = {
	forPackage: EntityId;
	maintainer: any;
	webapp: BundleAddr;
	webappToken: WebAppToken;
	changelog: string | undefined;
	sourceCodeRevisionUri: string | undefined;
	metadata: any;
};

export type CreateWebAppInput = {
	manifest: WebAppManifestV1;
};

export type WebAppEntry = {
	manifest: WebAppManifestV1;
	webappToken: WebAppToken;
};

export type WebAppEntryInput = {
	manifest: WebAppManifestV1;
	webappToken: WebAppTokenInput;
};

export type WebAppManifestV1 = {
	name: string;
	ui: WebUI;
	happManifest: AppManifestLocation;
};

export type WebUI = {
	uiEntry: EntryHash;
};

export type AppManifestLocation = {
	appEntry: EntryHash;
};

export type WebAppToken = {
	uiHash: Uint8Array;
	appToken: AppToken;
};

export type WebAppTokenInput = {
	uiHash: Uint8Array;
	appToken: AppTokenInput;
};

export type DeprecationNotice = {
	message: string;
	recommendedAlternatives: Array<ActionHash>;
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

export type Wasm = {
	wasmType: WasmType;
	mereMemoryAddr: EntryHash;
	fileSize: number;
	bytes: Uint8Array;
};

export type WasmEntry = {
	wasmType: WasmType;
	mereMemoryAddr: EntryHash;
	fileSize: number;
};

export enum WasmType {
	Integrity = 'integrity',
	Coordinator = 'coordinator'
}

export type CreateWasmEntryInput = {
	wasmType: WasmType;
	mereMemoryAddress: EntryHash;
};

// DNA HUB

export type DnaEntry = {
	manifest: DnaManifestV1;
	dnaToken: DnaToken;
	integritiesToken: IntegritiesToken;
	coordinatorsToken: CoordinatorsToken;
};

export type DnaEntryInput = {
	manifest: DnaManifestV1;
	dnaToken: DnaToken;
	integritiesToken: IntegritiesTokenInput;
	coordinatorsToken: CoordinatorsTokenInput;
};

export type IntegritiesToken = Array<[string, Uint8Array]>;
export type CoordinatorsToken = Array<[string, Uint8Array]>;

export type IntegritiesTokenInput = Array<[string, Uint8Array]>;
export type CoordinatorsTokenInput = Array<[string, Uint8Array]>;

export type CreateDnaInput = {
	manifest: DnaManifestV1;
};

export type DnaManifestV1 = {
	name: string;
	integrity: IntegrityManifest;
	coordinator: CoordinatorManifest;
};

export type IntegrityManifest = {
	networkSeed: string | undefined;
	properties: any | undefined;
	originTime: any;
	zomes: Array<ZomeManifest>;
};

export type CoordinatorManifest = {
	zomes: Array<ZomeManifest>;
};

export type ZomeManifest = {
	name: ZomeName;
	hash: WasmHashB64 | undefined;
	wasmHrl: HRL;
	dependencies: Array<ZomeDependency> | undefined;
	dylib: any;
};

export type ZomeDependency = {
	name: ZomeName;
};

export type DnaToken = {
	integrityHash: Uint8Array;
	integritiesTokenHash: Uint8Array;
	coordinatorsTokenHash: Uint8Array;
};

export type HRL = {
	dna: DnaHash;
	target: AnyDhtHash;
};
