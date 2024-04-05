import type { AgentPubKey } from '@holochain/client';
import { z } from 'zod';

export const MAIN_SCREEN = 'main';
export const SETTINGS_SCREEN = 'settings';

export const ANIMATION_DURATION = 300;

export type Screen = typeof MAIN_SCREEN | typeof SETTINGS_SCREEN;

export const APP_STORE = 'app-store';
export const APPS_VIEW = 'apps-view';

export const MainScreenRouteSchema = z.union([z.literal(APP_STORE), z.literal(APPS_VIEW)]);

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
