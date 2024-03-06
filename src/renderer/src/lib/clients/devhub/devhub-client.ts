/* eslint-disable @typescript-eslint/no-unused-vars */
import {
	type ActionHash,
	type AgentPubKey,
	type AnyDhtHash,
	type AppAgentCallZomeRequest,
	type AppAgentClient,
	decodeHashFromBase64,
	encodeHashToBase64,
	type EntryHash
} from '@holochain/client';
import { Bundle } from '@spartan-hc/bundles';

import type { MereMemoryClient } from '../mere-memory/mere-memory-client';
import type { DnaHubClient } from './dnahub-client';
import type {
	AppEntry,
	AppEntryInput,
	CreateAppInput,
	CreateUiEntryInput,
	CreateWebAppInput,
	CreateWebAppPackageFrontendInput,
	CreateWebAppPackageInput,
	DeprecationNotice,
	Entity,
	EntityId,
	Ui,
	UiEntry,
	UpdateEntityInput,
	UpdateWebAppPackageInput,
	WebAppEntry,
	WebAppEntryInput,
	WebAppPackageEntry,
	WebAppPackageEntryInput,
	WebAppPackageVersionMap
} from './types';

export type CompressionType = 'gzip';

export class AppHubClient {
	constructor(
		public client: AppAgentClient,
		public mereMemoryClient: MereMemoryClient,
		public dnaHubClient: DnaHubClient,
		public roleName = 'apphub',
		public zomeName = 'apphub_csr'
	) {}

	// App

	async createAppEntry(input: AppEntryInput): Promise<Entity<AppEntry>> {
		return this.callZome('create_app_entry', input);
	}

	async createApp(input: CreateAppInput): Promise<Entity<AppEntry>> {
		return this.callZome('create_app', input);
	}

	async getAppEntry(address: AnyDhtHash): Promise<Entity<AppEntry>> {
		return this.callZome('get_app_entry', address);
	}

	async getAppEntriesForAgent(agentPubKey?: AgentPubKey): Promise<Array<Entity<AppEntry>>> {
		return this.callZome('get_app_entries_for_agent', agentPubKey);
	}

	async deleteApp(address: ActionHash): Promise<ActionHash> {
		return this.callZome('delete_app', address);
	}

	// UI

	async createUiEntry(uiEntry: UiEntry): Promise<Entity<UiEntry>> {
		return this.callZome('create_ui_entry', uiEntry);
	}

	async createUi(input: CreateUiEntryInput): Promise<Entity<UiEntry>> {
		return this.callZome('create_ui', input);
	}

	async getUiEntry(address: AnyDhtHash): Promise<Entity<UiEntry>> {
		return this.callZome('get_ui_entry', address);
	}

	async getUi(address: AnyDhtHash): Promise<Ui> {
		const uiEntryEntity = await this.getUiEntry(address);
		const uiEntry = uiEntryEntity.content;
		const uiBytes = await this.mereMemoryClient.getMereMemoryBytes(uiEntry.mereMemoryAddr);
		return {
			mereMemoryAddr: uiEntry.mereMemoryAddr,
			fileSize: uiEntry.fileSize,
			bytes: uiBytes
		};
	}

	async getUiBytes(address: AnyDhtHash): Promise<Uint8Array> {
		const uiEntryEntity = await this.getUiEntry(address);
		return this.mereMemoryClient.getMereMemoryBytes(uiEntryEntity.content.mereMemoryAddr);
	}

	async getUiEntriesForAgent(agentPubKey?: AgentPubKey): Promise<Array<Entity<UiEntry>>> {
		return this.callZome('get_ui_entries_for_agent', agentPubKey);
	}

	async deleteUi(actionHash: ActionHash): Promise<ActionHash> {
		return this.callZome('delete_ui', actionHash);
	}

	// WebApp

	async createWebappEntry(input: WebAppEntryInput): Promise<Entity<WebAppEntry>> {
		return this.callZome('create_webapp_entry', input);
	}

	async createWebapp(input: CreateWebAppInput): Promise<Entity<WebAppEntry>> {
		return this.callZome('create_web_app', input);
	}

	async getWebappEntry(address: AnyDhtHash): Promise<Entity<WebAppEntry>> {
		return this.callZome('get_webapp_entry', address);
	}

	async getWebappEntriesForAgent(agentPubKey?: AgentPubKey): Promise<Array<Entity<WebAppEntry>>> {
		return this.callZome('get_webapp_entries_for_agent', agentPubKey);
	}

	async deleteWebapp(actionHash: ActionHash): Promise<ActionHash> {
		return this.callZome('delete_webapp', actionHash);
	}

	// WebApp Package

	async createWebappPackage(
		input: CreateWebAppPackageFrontendInput
	): Promise<Entity<WebAppPackageEntry>> {
		const iconAddress = await this.mereMemoryClient.saveBytes(input.icon);
		input.icon = iconAddress;
		return this.callZome('create_webapp_package', input);
	}

	async createWebappPackageEntry(
		input: WebAppPackageEntryInput
	): Promise<Entity<WebAppPackageEntry>> {
		return this.callZome('create_webapp_package_entry', input);
	}

	async getWebappPackage(address: EntityId): Promise<Entity<WebAppPackageEntry>> {
		return this.callZome('get_webapp_package', address);
	}

	async getWebappPackageEntry(address: AnyDhtHash): Promise<Entity<WebAppPackageEntry>> {
		return this.callZome('get_webapp_package_entry', address);
	}

	async getWebappPackageVersions(webappPackageId: EntityId): Promise<WebAppPackageVersionMap> {
		return this.callZome('get_webapp_package_versions', webappPackageId);
	}

	async getAllWebappPackages(): Promise<Entity<WebAppPackageEntry>> {
		return this.callZome('get_all_webapp_packages', null);
	}

	async updateWebappPackage(
		input: UpdateEntityInput<UpdateWebAppPackageInput>
	): Promise<Entity<WebAppPackageEntry>> {
		return this.callZome('update_webapp_package', input);
	}

	async deprecateWebappPackage(
		input: UpdateEntityInput<DeprecationNotice>
	): Promise<Entity<WebAppPackageEntry>> {
		return this.callZome('deprecate_webapp_package', input);
	}

	async deleteWabappPackage(address: ActionHash): Promise<ActionHash> {
		return this.callZome('delete_webapp_package', address);
	}

	//  WebAppPackage Links

	// TODO

	// WebApp Package Version

	// TODO

	// Helper functions

	protected callZome(fn_name: string, payload: unknown) {
		const req: AppAgentCallZomeRequest = {
			role_name: this.roleName,
			zome_name: this.zomeName,
			fn_name,
			payload
		};
		return this.client.callZome(req);
	}
}
