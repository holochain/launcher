/* eslint-disable @typescript-eslint/no-unused-vars */
import { type ActionHash, type AgentPubKey, type AnyDhtHash } from '@holochain/client';

import { ZomeClient } from '../../app-client/app-client';
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
} from '../types';

export type CompressionType = 'gzip';

export class AppHubZomeClient extends ZomeClient {
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

	async createWebappPackageEntry(
		input: WebAppPackageEntryInput
	): Promise<Entity<WebAppPackageEntry>> {
		return this.callZome('create_webapp_package_entry', input);
	}

	async createWebappPackage(input: CreateWebAppPackageInput): Promise<Entity<WebAppPackageEntry>> {
		return this.callZome('create_webapp_package', input);
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
}
