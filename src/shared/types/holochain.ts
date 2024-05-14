import { z } from 'zod';

import { DistributionInfoV1Schema } from './launcher';

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
    lairUrl: z.string(),
    appsDataDir: z.string(),
    adminPort: z.number(),
  }),
]);

export const CellIdSchema = z.tuple([z.instanceof(Uint8Array), z.instanceof(Uint8Array)]);
export type CellId = z.infer<typeof CellIdSchema>;

export const CellInfoSchema = z.union([
  z.object({
    provisioned: z.object({
      cell_id: CellIdSchema,
    }),
  }),
  z.object({
    cloned: z.object({
      cell_id: CellIdSchema,
    }),
  }),
  z.object({
    stem: z.object({}),
  }),
]);

export type CellInfo = z.infer<typeof CellInfoSchema>;

export type HolochainVersion = z.infer<typeof HolochainVersionSchema>;

export const InstalledAppInfoStatusSchema = z.union([
  z.object({
    paused: z.object({}),
  }),
  z.object({
    disabled: z.object({}),
  }),
  z.literal('running'),
]);

export type InstalledAppInfoStatus = z.infer<typeof InstalledAppInfoStatusSchema>;

export const AppInfoSchema = z.object({
  agent_pub_key: z.instanceof(Uint8Array),
  installed_app_id: z.string(),
  cell_info: z.record(z.string(), z.array(CellInfoSchema)),
  status: InstalledAppInfoStatusSchema,
});

const HolochainDataRootSchema = z.union([
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
  holochainDataRoot: HolochainDataRootSchema,
  icon: z.string().optional(),
  distributionInfo: DistributionInfoV1Schema,
});

export const InitializeAppPortsSchema = z.object({
  appPort: z.number(),
  appstoreAuthenticationToken: z.array(z.number()),
  devhubAuthenticationToken: z.array(z.number()).optional(),
});

export type InitializeAppPorts = z.infer<typeof InitializeAppPortsSchema>;

export type ExtendedAppInfo = z.infer<typeof ExtendedAppInfoSchema>;

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

export type LoadingProgressUpdate =
  | 'initializingLairKeystore'
  | 'startingLairKeystore'
  | 'startingHolochain'
  | 'installingAppStore'
  | 'installingDevHub'
  | '';

export type AppToInstall = {
  id: string;
  sha256: string;
  name: string;
  progressUpdate: LoadingProgressUpdate;
};
