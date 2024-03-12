/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AnyDhtHash, AppAgentClient, ZomeName } from '@holochain/client';
// @ts-expect-error this package does not have types at the moment...
import { Bundle } from '@spartan-hc/bundles';

import { getCellId } from '$helpers';

import { MereMemoryZomeClient } from '../mere-memory/mere-memory-client';
import {
	type CreateWebAppPackageFrontendInput,
	type DnaEntry,
	type Entity,
	type Ui,
	type Wasm,
	type WasmEntry,
	WasmType,
	type WebAppPackageEntry
} from './types';
import { AppHubZomeClient } from './zomes/apphub-zome-client';
import { DnaHubZomeClient } from './zomes/dnahub-zome-client';
import { ZomeHubZomeClient } from './zomes/zomehub-zome-client';

export class DevhubAppClient {
	mereMemoryZomeClient: MereMemoryZomeClient;
	zomeHubZomeClient: ZomeHubZomeClient;
	dnaHubZomeClient: DnaHubZomeClient;
	appHubZomeClient: AppHubZomeClient;

	constructor(public client: AppAgentClient) {
		this.mereMemoryZomeClient = new MereMemoryZomeClient(client, 'mere_memory', 'mere_memory_api');
		this.zomeHubZomeClient = new ZomeHubZomeClient(client, 'zomehub', 'zomehub_csr');
		this.dnaHubZomeClient = new DnaHubZomeClient(client, 'dnahub', 'dnahub_csr');
		this.appHubZomeClient = new AppHubZomeClient(client, 'apphub', 'apphub_csr');
	}

	async saveIntegrityZome(bytes: Uint8Array): Promise<Entity<WasmEntry>> {
		const mereMemoryAddress = await this.mereMemoryZomeClient.saveBytes(bytes);
		return this.zomeHubZomeClient.createWasm({
			wasm_type: WasmType.Integrity,
			mere_memory_address: mereMemoryAddress
		});
	}

	async saveCoordinatorZome(bytes: Uint8Array): Promise<Entity<WasmEntry>> {
		const mereMemoryAddress = await this.mereMemoryZomeClient.saveBytes(bytes);
		return this.zomeHubZomeClient.createWasm({
			wasm_type: WasmType.Coordinator,
			mere_memory_address: mereMemoryAddress
		});
	}

	async getWasm(addr: AnyDhtHash): Promise<Wasm> {
		const wasmEntryEntity = await this.zomeHubZomeClient.getWasmEntry(addr);
		const wasmEntry = wasmEntryEntity.content;
		const wasmBytes = await this.mereMemoryZomeClient.getMereMemoryBytes(
			wasmEntry.mere_memory_address
		);
		return {
			wasm_type: wasmEntry.wasm_type,
			mere_memory_address: wasmEntry.mere_memory_address,
			file_size: wasmEntry.file_size,
			bytes: wasmBytes
		};
	}

	async getIntegrityWasm(input: { dnaEntryAddress: AnyDhtHash; name: ZomeName }): Promise<Wasm> {
		const dnaEntryEntity = await this.dnaHubZomeClient.getDnaEntry(input.dnaEntryAddress);
		const zomeManifest = dnaEntryEntity.content.manifest.integrity.zomes.find(
			(zomeManifest) => zomeManifest.name === input.name
		);

		if (!zomeManifest)
			throw new Error(
				`DNA entry (${input.dnaEntryAddress}) does not have an integrity zome named '${input.name}'`
			);

		return this.getWasm(zomeManifest.wasm_hrl.target);
	}

	async getCoordinatorWasm(input: { dnaEntryAddress: AnyDhtHash; name: ZomeName }) {
		const dnaEntryEntity = await this.dnaHubZomeClient.getDnaEntry(input.dnaEntryAddress);
		const zomeManifest = dnaEntryEntity.content.manifest.coordinator.zomes.find(
			(zomeManifest) => zomeManifest.name === input.name
		);

		if (!zomeManifest)
			throw new Error(
				`DNA entry (${input.dnaEntryAddress}) does not have an coordinator zome named '${input.name}'`
			);

		return this.getWasm(zomeManifest.wasm_hrl.target);
	}

	async getDnaBundle(addr: AnyDhtHash) {
		const dnaEntryEntity = await this.dnaHubZomeClient.getDnaEntry(addr);

		for (const zomeManifest of dnaEntryEntity.content.manifest.integrity.zomes as any) {
			const wasm = await this.getWasm(zomeManifest.wasmHrl.target);
			zomeManifest.bytes = wasm.bytes;
			delete zomeManifest.wasm_hrl;
		}

		for (const zomeManifest of dnaEntryEntity.content.manifest.coordinator.zomes as any) {
			const wasm = await this.getWasm(zomeManifest.wasmHrl.target);
			zomeManifest.bytes = wasm.bytes;
			delete zomeManifest.wasm_hrl;
		}

		const bundle = Bundle.createDna(dnaEntryEntity.content.manifest);

		return bundle.toBytes();
	}

	async saveDna(bytes: Uint8Array): Promise<Entity<DnaEntry>> {
		const bundle = new Bundle(bytes, 'dna');

		const zomeHubAppInfo = await this.client.appInfo();
		const zomeHubCell = zomeHubAppInfo.cell_info.zome_hub;
		const zomeHubCellProvisioned = zomeHubCell.find((cellInfo) => 'provisioned' in cellInfo);
		if (!zomeHubCellProvisioned) throw new Error('No zome_hub cell found.');
		const zomehubCellId = getCellId(zomeHubCellProvisioned);
		if (!zomehubCellId) throw new Error('zome_hub CellId undefined.');

		for (const zome_manifest of bundle.manifest.integrity.zomes) {
			const rpath = zome_manifest.bundled;
			const wasm_bytes = bundle.resources[rpath];
			const wasm = await this.saveIntegrityZome(wasm_bytes);

			zome_manifest.wasm_hrl = {
				dna: zomehubCellId[0],
				target: wasm.content.mere_memory_address
			};

			delete zome_manifest.bundled;
		}

		for (const zome_manifest of bundle.manifest.coordinator.zomes) {
			const rpath = zome_manifest.bundled;
			const wasm_bytes = bundle.resources[rpath];
			const wasmEntity = await this.saveCoordinatorZome(wasm_bytes);

			zome_manifest.wasm_hrl = {
				dna: zomehubCellId[0],
				target: wasmEntity.content.mere_memory_address
			};

			delete zome_manifest.bundled;
		}

		return this.dnaHubZomeClient.createDna({
			manifest: bundle.manifest
		});
	}

	async getUi(address: AnyDhtHash): Promise<Ui> {
		const uiEntryEntity = await this.appHubZomeClient.getUiEntry(address);
		const uiEntry = uiEntryEntity.content;
		const uiBytes = await this.mereMemoryZomeClient.getMereMemoryBytes(uiEntry.mere_memory_address);
		return {
			mere_memory_address: uiEntry.mere_memory_address,
			file_size: uiEntry.file_size,
			bytes: uiBytes
		};
	}

	async getUiBytes(address: AnyDhtHash): Promise<Uint8Array> {
		const uiEntryEntity = await this.appHubZomeClient.getUiEntry(address);
		return this.mereMemoryZomeClient.getMereMemoryBytes(uiEntryEntity.content.mere_memory_address);
	}

	async createWebappPackage(
		input: CreateWebAppPackageFrontendInput
	): Promise<Entity<WebAppPackageEntry>> {
		const iconAddress = await this.mereMemoryZomeClient.saveBytes(input.icon);
		input.icon = iconAddress;
		return this.appHubZomeClient.createWebappPackage(input);
	}
}
