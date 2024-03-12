import type { AgentPubKey, AnyDhtHash, AppAgentCallZomeRequest } from '@holochain/client';

import { ZomeClient } from '$lib/clients/app-client/app-client';

import type { CreateWasmEntryInput, Entity, WasmEntry } from '../types';

export class ZomeHubZomeClient extends ZomeClient {
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
