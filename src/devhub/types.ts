import { ActionHash, AgentPubKey, EntryHash } from "@holochain/client";

export interface DeprecationNotice {
  message: string;

  // optional
  recommended_alternatives: Array<ActionHash> | undefined;
}

export interface HappEntry {
  title: string;
  subtitle: string;
  description: string;
  designer: AgentPubKey;
  published_at: number;
  last_updated: number;
  metadata: Record<string, any>;

  // optional
  tags: Array<string> | undefined;
  icon: Uint8Array | undefined;
  deprecation: DeprecationNotice | undefined;
}

//
// Happ Release Entry
//
export interface DnaReference {
  role_name: string;
  dna: ActionHash; // Dna ID
  version: ActionHash; // Version ID
  wasm_hash: string;
}

export interface HappReleaseEntry {
  name: string;
  description: string;
  for_happ: ActionHash;
  ordering: number;
  published_at: number;
  last_updated: number;
  manifest: any;
  dna_hash: string;
  hdk_version: string;
  dnas: Array<DnaReference>;
  metadata: Record<string, any>; // BTreeMap<String, serde_yaml::Value> in Rust

  // Optional fields
  official_gui: ActionHash | undefined;
}

export interface GUIEntry {
  name: string;
  description: string;
  designer: AgentPubKey;
  published_at: number;
  last_updated: number;
  holo_hosting_settings: any;
  metadata: Record<string, any>;

  // optional
  tags: Array<string> | undefined;
  screenshots: Array<EntryHash> | undefined;
  deprecation: DeprecationNotice | undefined;
}

export interface GUIReleaseEntry {
  version: string;
  changelog: string;
  for_gui: ActionHash;
  for_happ_releases: Array<ActionHash>;
  web_asset_id: ActionHash;
  published_at: number;
  last_updated: number;
  metadata: Record<string, any>;

  // Optional fields
  screenshots: Array<EntryHash> | undefined;
  // pub dna_support: Option<Vec<EntryHash>>, // list of DnaEntry IDs of intended support, does not mean they are guaranteed to work for all those DNA's versions
}

export interface DnaReference {
  role_name: string;
  dna: ActionHash; // Dna ID
  version: ActionHash; // Version ID
  wasm_hash: string;
}
