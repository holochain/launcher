import type { AgentPubKey, AnyDhtHash, AppCallZomeRequest } from '@holochain/client';

import type { AgentInfo } from '../../types';
import { ZomeClient } from '../../zome-client/zome-client';
import type { CreateZomeEntryInput, Entity, ZomeEntry } from '../types';

export class ZomeHubZomeClient extends ZomeClient {
  async whoami(): Promise<AgentInfo> {
    return this.callZome('whoami', null);
  }

  async createZomeEntry(input: ZomeEntry): Promise<Entity<ZomeEntry>> {
    return this.callZome('create_zome_entry', input);
  }

  async createZome(input: CreateZomeEntryInput): Promise<Entity<ZomeEntry>> {
    return this.callZome('create_zome', input);
  }

  async getZomeEntry(address: AnyDhtHash): Promise<Entity<ZomeEntry>> {
    return this.callZome('get_zome_entry', address);
  }

  async getZomeEntriesForAgent(agentPubKey?: AgentPubKey): Promise<Array<Entity<ZomeEntry>>> {
    return this.callZome('get_zome_entries_for_agent', agentPubKey);
  }

  protected callZome(fn_name: string, payload: unknown) {
    const req: AppCallZomeRequest = {
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name,
      payload,
    };
    return this.client.callZome(req);
  }
}
