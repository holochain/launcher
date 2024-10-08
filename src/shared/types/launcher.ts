import type { AgentPubKey } from '@holochain/client';
import type { BrowserWindow } from 'electron';
import { z } from 'zod';

import {
  APP_STORE,
  APPS_VIEW,
  DISTRIBUTION_TYPE_APPSTORE,
  DISTRIBUTION_TYPE_DEFAULT_APP,
  DISTRIBUTION_TYPE_FILESYSTEM,
  type MAIN_WINDOW,
  type SETTINGS_WINDOW,
} from '../const';
import type { HolochainDataRoot } from './holochain';

type UrlAndSha256 = {
  version: string;
  sha256: Sha256;
};

type TargetTriple =
  | 'x86_64-unknown-linux-gnu'
  | 'x86_64-pc-windows-msvc.exe'
  | 'x86_64-apple-darwin'
  | 'aarch64-apple-darwin';

type Sha256 = string;

type VersionAndSha256 = {
  version: string;
  sha256: Record<TargetTriple, Sha256>;
};

export type LauncherConfig = {
  binaries: Record<string, VersionAndSha256>;
  defaultApps: Record<string, UrlAndSha256>;
  binariesAppendix: string;
};

export type AdminWindow = typeof MAIN_WINDOW | typeof SETTINGS_WINDOW;

export const MainScreenRouteSchema = z.union([z.literal(APP_STORE), z.literal(APPS_VIEW)]);

export type MainScreenRoute = z.infer<typeof MainScreenRouteSchema>;

export type WindowInfo = {
  agentPubKey: AgentPubKey;
  installedAppId: string;
  holochainDataRoot: HolochainDataRoot;
  adminPort?: number;
  windowObject: BrowserWindow;
};

export type WindowInfoRecord = Record<number, WindowInfo>;

export const CommonAppSchema = z.object({
  appId: z.string().min(1),
  networkSeed: z.string(),
  icon: z.instanceof(Uint8Array).optional(),
  agentPubKey: z.string().optional(),
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

export const AppStoreDistributionInfoSchema = z.object({
  type: z.literal(DISTRIBUTION_TYPE_APPSTORE),
  appName: z.string(),
  appstoreDnaHash: z.string(),
  appEntryActionHash: z.string(),
  appVersionActionHash: z.string(),
});

export const DistributionInfoV1Schema = z.union([
  z.object({
    type: z.literal(DISTRIBUTION_TYPE_FILESYSTEM),
  }),
  z.object({
    type: z.literal(DISTRIBUTION_TYPE_DEFAULT_APP),
  }),
  AppStoreDistributionInfoSchema,
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

export const IncludeHeadlessSchema = z.boolean().default(false);

export type UpdateUiFromHash = z.infer<typeof UpdateUiFromHashSchema>;
