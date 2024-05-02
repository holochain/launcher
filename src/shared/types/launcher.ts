import type { AgentPubKey } from '@holochain/client';
import { z } from 'zod';

import { APP_STORE, APPS_VIEW, type MAIN_SCREEN, type SETTINGS_SCREEN } from '../const';

export type Screen = typeof MAIN_SCREEN | typeof SETTINGS_SCREEN;

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

export const CommonAppSchema = z.object({
  appId: z.string().min(1),
  networkSeed: z.string(),
  // TODO add membrane proofs here
});

export const InstallDefaultAppSchema = CommonAppSchema.extend({
  name: z.string(), // name of the default app file (e.g. kando.webhapp or devhub.happ)
});

export type InstallDefaultApp = z.infer<typeof InstallDefaultAppSchema>;

export const InstallHappFromPathSchema = CommonAppSchema.extend({
  filePath: z.string(),
});

export type InstallHappOrWebhappInput = z.infer<typeof InstallHappOrWebhappFromBytesSchema>;

export const BytesSchema = z.object({
  bytes: z.instanceof(Uint8Array),
});

export const DistributionInfoV1Schema = z.union([
  z.object({ type: z.literal('filesystem') }),
  z.object({ type: z.literal('default-app') }),
  z.object({
    type: z.literal('appstore'),
    appName: z.string(),
    appstoreDnaHash: z.string({ description: 'DnaHashB64' }),
    appEntryActionHash: z.string({ description: 'ActionHashB64' }),
    appVersionActionHash: z.string({ description: 'ActionHashB64' }),
    appVersion: z.string({ description: 'version name' }),
  }),
]);

export type DistributionInfoV1 = z.infer<typeof DistributionInfoV1Schema>;

export const InstallHappOrWebhappFromBytesSchema = CommonAppSchema.extend({
  bytes: z.instanceof(Uint8Array),
  distributionInfo: DistributionInfoV1Schema,
});

export const InstallWebhappFromHashesSchema = CommonAppSchema.extend({
  happSha256: z.string(),
  uiZipSha256: z.string(),
  distributionInfo: DistributionInfoV1Schema,
});

export const UpdateUiFromHashSchema = z.object({
  uiZipSha256: z.string(),
  appId: z.string(),
  appVersionActionHash: z.optional(z.string({ description: 'ActionHashB64' })),
});
