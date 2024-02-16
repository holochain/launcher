import type { AgentPubKey } from '@holochain/client';
import { z } from 'zod';

export const mainScreen = 'main';
export const settingsScreen = 'settings';

export type Screen = typeof mainScreen | typeof settingsScreen;

export const AppStore = 'app-store';
export const AppsView = 'apps-view';

export const MainScreenRouteSchema = z.union([z.literal(AppStore), z.literal(AppsView)]);

export type MainScreenRoute = z.infer<typeof MainScreenRouteSchema>;

export type WindowInfo = {
  agentPubKey: AgentPubKey;
  installedAppId: string;
  adminPort?: number;
};

export type WindowInfoRecord = Record<number, WindowInfo>;

export const HolochainLairVersionSchema = z.object({
  binaries: z.object({
    holochain: z.string(),
    lair_keystore: z.string(),
  }),
});
