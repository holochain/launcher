import type { AgentPubKey } from '@holochain/client';

export const mainScreen = 'main';
export const settingsScreen = 'settings';

export type Screen = typeof mainScreen | typeof settingsScreen;

export type WindowInfo = {
  agentPubKey: AgentPubKey;
  installedAppId: string;
  adminPort?: number;
};

export type WindowInfoRecord = Record<number, WindowInfo>;
