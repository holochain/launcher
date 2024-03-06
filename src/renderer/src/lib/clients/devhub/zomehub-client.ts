import type {
	AgentPubKey,
	AnyDhtHash,
	AppAgentCallZomeRequest,
	AppAgentClient
} from '@holochain/client';

import type { MereMemoryClient } from '../mere-memory/mere-memory-client';
import type { CreateWasmEntryInput, Entity, Wasm, WasmEntry } from './types';
import { WasmType } from './types';

export class ZomeHubClient {
	constructor(
		public client: AppAgentClient,
		public mereMemoryClient: MereMemoryClient,
		public roleName = 'zomehub',
		public zomeName = 'zomehub_csr'
	) {}

	async createWasmEntry(input: WasmEntry): Promise<Entity<WasmEntry>> {
		return this.callZome('create_wasm_entry', input);
	}

	async createWasm(input: CreateWasmEntryInput): Promise<Entity<WasmEntry>> {
		return this.callZome('create_wasm', input);
	}

	async getWasmEntry(address: AnyDhtHash): Promise<Entity<WasmEntry>> {
		return this.callZome('get_wasm_entry', address);
	}

	async getWasmEntriesForAgent(agentPubKey?: AgentPubKey): Promise<Array<Entity<WasmEntry>>> {
		return this.callZome('get_wasm_entries_for_agent', agentPubKey);
	}

	async saveIntegrity(bytes: Uint8Array): Promise<Entity<WasmEntry>> {
		const mereMemoryAddress = await this.mereMemoryClient.saveBytes(bytes);
		return this.createWasm({
			wasmType: WasmType.Integrity,
			mereMemoryAddress
		});
	}

	async saveCoordinator(bytes: Uint8Array): Promise<Entity<WasmEntry>> {
		const mereMemoryAddress = await this.mereMemoryClient.saveBytes(bytes);
		return this.createWasm({
			wasmType: WasmType.Coordinator,
			mereMemoryAddress
		});
	}

	async getWasm(addr: AnyDhtHash): Promise<Wasm> {
		const wasmEntryEntity = await this.getWasmEntry(addr);
		const wasmEntry = wasmEntryEntity.content;
		const wasmBytes = await this.mereMemoryClient.getMereMemoryBytes(wasmEntry.mereMemoryAddr);
		return {
			wasmType: wasmEntry.wasmType,
			mereMemoryAddr: wasmEntry.mereMemoryAddr,
			fileSize: wasmEntry.fileSize,
			bytes: wasmBytes
		};
	}

	async getWasmBytes(addr: AnyDhtHash): Promise<Uint8Array> {
		const wasmEntryEntity = await this.getWasmEntry(addr);
		return this.mereMemoryClient.getMereMemoryBytes(wasmEntryEntity.content.mereMemoryAddr);
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
