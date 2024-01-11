import { AgentPubKey, AppInfo } from '@holochain/client';
import { z } from 'zod';

export const HolochainVersionSchema = z.union([
  z.object({
    type: z.literal('built-in'),
    version: z.string(),
  }),
  z.object({
    type: z.literal('custom-path'),
    path: z.string(),
  }),
  z.object({
    type: z.literal('running-external'),
    configPath: z.string(),
    appsDataDir: z.string(),
    adminPort: z.number(),
  }),
]);

export type HolochainVersion = z.infer<typeof HolochainVersionSchema>;

export const AppInfoSchema = z.object({
  agent_pub_key: z.instanceof(Uint8Array),
  installed_app_id: z.string(),
});

export const CommonAppSchema = z.object({
  appId: z.string().min(1),
  partition: z.string(),
});

export const InstallKandoSchema = CommonAppSchema.extend({
  networkSeed: z.string(),
});

export type InstallKando = z.infer<typeof InstallKandoSchema>;

export const InstallHappInputSchema = InstallKandoSchema.extend({
  filePath: z.string().optional(),
});

export type InstallHappInput = z.infer<typeof InstallHappInputSchema>;

export const HolochainDataRootSchema = z.union([
  z.object({
    type: z.literal('partition'),
    name: z.string(),
  }),
  z.object({
    type: z.literal('external'),
    name: z.string(),
    path: z.string(),
  }),
]);

export type HolochainDataRoot = z.infer<typeof HolochainDataRootSchema>;

export const HolochainPartitionSchema = z.union([
  z.object({
    type: z.literal('default'),
  }),
  z.object({
    type: z.literal('custom'),
    name: z.string(),
  }),
  z.object({
    type: z.literal('external'),
    name: z.string(),
    path: z.string(),
  }),
]);

export type HolochainPartition = z.infer<typeof HolochainPartitionSchema>;

export const ExtendedAppInfoSchema = z.object({
  appInfo: AppInfoSchema,
  version: HolochainVersionSchema,
  holochainDataRoot: HolochainDataRootSchema,
});

export type ExtendedAppInfo = {
  appInfo: AppInfo;
  version: HolochainVersion;
  holochainDataRoot: HolochainDataRoot;
};

export interface RunningHolochain {
  version: HolochainVersion;
  holochainDataRoot: HolochainDataRoot;
  appPort: number;
}

export type HolochainData = {
  version: HolochainVersion;
  holochainDataRoot: HolochainDataRoot;
  data: unknown;
};

export type WindowInfo = {
  agentPubKey: AgentPubKey;
  adminPort?: number;
};

export type LoadingProgressUpdate = 'startingLairKeystore' | 'startingHolochain';
