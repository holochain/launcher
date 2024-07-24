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
  z.literal('awaiting_memproofs'),
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
  icon: z.instanceof(Uint8Array).optional(),
  distributionInfo: DistributionInfoV1Schema,
  isHeadless: z.boolean(),
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
  name: string;
  progressUpdate: LoadingProgressUpdate;
};

const HRLSchema = z.object({
  dna: z.instanceof(Uint8Array),
  target: z.instanceof(Uint8Array),
});

const BundleHashesSchema = z.object({
  ui_hash: z.string(),
  happ_hash: z.string(),
  hash: z.string(),
});

const AppVersionEntrySchema = z.object({
  version: z.string(),
  for_app: z.instanceof(Uint8Array),
  apphub_hrl: HRLSchema,
  apphub_hrl_hash: z.instanceof(Uint8Array),
  bundle_hashes: BundleHashesSchema,
  author: z.instanceof(Uint8Array),
  published_at: z.number(),
  last_updated: z.number(),
  metadata: z.any().optional(),
});

export const AppVersionEntrySchemaWithIcon = z.object({
  app_version: AppVersionEntrySchema,
  icon: z.instanceof(Uint8Array).optional(),
});
