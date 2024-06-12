import type { ActionHash, AgentPubKey } from '@holochain/client';

export type UpdateEntityInput<T> = {
  base: ActionHash;
  properties: T;
};

export type AgentInfo = {
  agent_initial_pubkey: AgentPubKey;
  agent_latest_pubkey: AgentPubKey;
};
