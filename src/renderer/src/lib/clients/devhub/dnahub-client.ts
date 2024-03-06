/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
	ActionHash,
	AgentPubKey,
	AnyDhtHash,
	AppAgentCallZomeRequest,
	AppAgentClient,
	ZomeName
} from '@holochain/client';
import { Bundle } from '@spartan-hc/bundles';

import { getCellId } from '$helpers';

import type { MereMemoryClient } from '../mere-memory/mere-memory-client';
import type {
	CoordinatorsToken,
	CreateDnaInput,
	DnaEntry,
	DnaEntryInput,
	DnaToken,
	Entity,
	IntegritiesToken,
	Wasm
} from './types';
import type { ZomeHubClient } from './zomehub-client';

export class DnaHubClient {
	constructor(
		public client: AppAgentClient,
		public mereMemoryClient: MereMemoryClient,
		public zomeHubClient: ZomeHubClient,
		public roleName = 'dnahub',
		public zomeName = 'dnahub_csr'
	) {}

	async createDna(input: CreateDnaInput): Promise<Entity<DnaEntry>> {
		return this.callZome('create_dna', input);
	}

	async createDnaEntry(input: DnaEntryInput): Promise<Entity<DnaEntry>> {
		return this.callZome('create_dna', input);
	}

	async deriveDnaToken(input: CreateDnaInput): Promise<DnaToken> {
		return this.callZome('derive_dna_token', input);
	}

	async deriveIntegritiesToken(input: CreateDnaInput): Promise<IntegritiesToken> {
		return this.callZome('derive_integrities_token', input);
	}

	async deriveCoordinatorsToken(input: CreateDnaInput): Promise<CoordinatorsToken> {
		return this.callZome('derive_coordinators_token', input);
	}

	async getDnaEntry(addr: AnyDhtHash): Promise<Entity<DnaEntry>> {
		return this.callZome('get_dna_entry', addr);
	}

	async getDnaEntriesForAgent(agentPubKey?: AgentPubKey): Promise<Array<Entity<DnaEntry>>> {
		return this.callZome('get_dna_entries_for_agent', agentPubKey);
	}

	async deleteDna(actionHash: ActionHash): Promise<ActionHash> {
		return this.callZome('delete_dna', actionHash);
	}

	async saveDna(bytes: Uint8Array): Promise<Entity<DnaEntry>> {
		const bundle = new Bundle(bytes, 'dna');

		const zomeHubAppInfo = await this.zomeHubClient.client.appInfo();
		const zomeHubCell = zomeHubAppInfo.cell_info.zome_hub;
		const zomeHubCellProvisioned = zomeHubCell.find((cellInfo) => 'provisioned' in cellInfo);
		if (!zomeHubCellProvisioned) throw new Error('No zome_hub cell found.');
		const zomehubCellId = getCellId(zomeHubCellProvisioned);
		if (!zomehubCellId) throw new Error('zome_hub CellId undefined.');

		for (const zome_manifest of bundle.manifest.integrity.zomes) {
			const rpath = zome_manifest.bundled;
			const wasm_bytes = bundle.resources[rpath];
			const wasm = await this.zomeHubClient.saveIntegrity(wasm_bytes);

			zome_manifest.wasm_hrl = {
				dna: zomehubCellId[0],
				target: wasm.content.mereMemoryAddr
			};

			delete zome_manifest.bundled;
		}

		for (const zome_manifest of bundle.manifest.coordinator.zomes) {
			const rpath = zome_manifest.bundled;
			const wasm_bytes = bundle.resources[rpath];
			const wasmEntity = await this.zomeHubClient.saveCoordinator(wasm_bytes);

			zome_manifest.wasm_hrl = {
				dna: zomehubCellId[0],
				target: wasmEntity.content.mereMemoryAddr
			};

			delete zome_manifest.bundled;
		}

		return this.createDna({
			manifest: bundle.manifest
		});
	}

	async getIntegrityWasm(input: { dnaEntryAddress: AnyDhtHash; name: ZomeName }): Promise<Wasm> {
		const dnaEntryEntity = await this.getDnaEntry(input.dnaEntryAddress);
		const zomeManifest = dnaEntryEntity.content.manifest.integrity.zomes.find(
			(zomeManifest) => zomeManifest.name === input.name
		);

		if (!zomeManifest)
			throw new Error(
				`DNA entry (${input.dnaEntryAddress}) does not have an integrity zome named '${input.name}'`
			);

		return this.zomeHubClient.getWasm(zomeManifest.wasmHrl.target);
	}
	async get_coordinator_wasm(input: { dnaEntryAddress: AnyDhtHash; name: ZomeName }) {
		const dnaEntryEntity = await this.getDnaEntry(input.dnaEntryAddress);
		const zomeManifest = dnaEntryEntity.content.manifest.coordinator.zomes.find(
			(zomeManifest) => zomeManifest.name === input.name
		);

		if (!zomeManifest)
			throw new Error(
				`DNA entry (${input.dnaEntryAddress}) does not have an coordinator zome named '${input.name}'`
			);

		return this.zomeHubClient.getWasm(zomeManifest.wasmHrl.target);
	}

	async get_dna_bundle(addr: AnyDhtHash) {
		const dnaEntryEntity = await this.getDnaEntry(addr);

		for (const zomeManifest of dnaEntryEntity.content.manifest.integrity.zomes as any) {
			const wasm = await this.zomeHubClient.getWasm(zomeManifest.wasmHrl.target);
			zomeManifest.bytes = wasm.bytes;
			delete zomeManifest.wasm_hrl;
		}

		for (const zomeManifest of dnaEntryEntity.content.manifest.coordinator.zomes as any) {
			const wasm = await this.zomeHubClient.getWasm(zomeManifest.wasmHrl.target);
			zomeManifest.bytes = wasm.bytes;
			delete zomeManifest.wasm_hrl;
		}

		const bundle = Bundle.createDna(dnaEntryEntity.content.manifest);

		return bundle.toBytes();
	}

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
