import type {
  ActionHash,
  ActionHashB64,
  AgentPubKey,
  DnaHash,
  FunctionName,
  ZomeName,
} from '@holochain/client';

export type DnaZomeFunction = {
  dna: DnaHash;
  zome: ZomeName;
  function: FunctionName;
};

export type TryWithHostsArgs<T> = {
  fn: (host: AgentPubKey, statusCallback: (status: string) => void) => Promise<T>;
  dnaZomeFunction: DnaZomeFunction;
  pingTimeout?: number;
  statusCallback?: (status: string) => void;
};

export type UpdateEntityInput<T> = {
  base: ActionHash;
  properties: T;
};

export type AgentInfo = {
  agent_initial_pubkey: AgentPubKey;
  agent_latest_pubkey: AgentPubKey;
};

export type AppstoreFilterLists = {
  /**
   * Named allowlists
   */
  allowlists: Record<string, AppStoreAllowList>;

  /**
   * A denylist containing action hashes of AppEntrys that should be hidden completely
   */
  denylist: AppStoreDenyList;
};

/**
 * A allowlist with AppEntry ids as keys
 */
export type AppStoreAllowList = Record<ActionHashB64, AppEntryAllowList>;

/**
 * A allowlist of AppEntry actions and ids of AppVersion entries associated
 * to the given AppEntry
 */
export type AppEntryAllowList = {
  actions: Array<ActionHashB64> | 'all';
  appVersions: Array<ActionHashB64> | 'all';
};

/**
 * A denylist containing action hashes of AppEntrys that should be hidden completely
 */
export type AppStoreDenyList = Array<ActionHashB64>;
