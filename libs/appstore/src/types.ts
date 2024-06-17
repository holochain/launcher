import type { ActionHash, ActionHashB64, AgentPubKey } from '@holochain/client';

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
   * Named whitelists
   */
  whitelists: Record<string, AppStoreWhiteList>;

  /**
   * A blacklist containing action hashes of AppEntrys that should be hidden completely
   */
  blacklist: AppStoreBlackList;
};

/**
 * A whitelist with AppEntry ids as keys
 */
export type AppStoreWhiteList = Record<ActionHashB64, AppEntryWhitelist>;

/**
 * A whitelist of AppEntry actions and ids of AppVersion entries associated
 * to the given AppEntry
 */
export type AppEntryWhitelist = {
  actions: Array<ActionHashB64> | 'all';
  appVersions: Array<ActionHashB64> | 'all';
};

/**
 * A blacklist containing action hashes of AppEntrys that should be hidden completely
 */
export type AppStoreBlackList = Array<ActionHashB64>;
