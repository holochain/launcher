/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  ActionHash,
  AgentPubKey,
  AnyDhtHash,
  AppAgentCallZomeRequest,
} from '@holochain/client';

import { ZomeClient } from '../../zome-client/zome-client';
import type {
  CoordinatorsToken,
  CreateDnaInput,
  DnaEntry,
  DnaEntryInput,
  DnaToken,
  Entity,
  IntegritiesToken,
} from '../types';

export class DnaHubZomeClient extends ZomeClient {
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

  protected callZome(fn_name: string, payload: unknown) {
    const req: AppAgentCallZomeRequest = {
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name,
      payload,
    };
    return this.client.callZome(req);
  }
}
