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
  z.object({
    running: z.null(),
  }),
]);

export type InstalledAppInfoStatus = z.infer<typeof InstalledAppInfoStatusSchema>;

export const AppInfoSchema = z.object({
  agent_pub_key: z.instanceof(Uint8Array),
  installed_app_id: z.string(),
  cell_info: z.record(z.string(), z.array(CellInfoSchema)),
  status: InstalledAppInfoStatusSchema,
});

export const CommonAppSchema = z.object({
  appId: z.string().min(1),
});

export const InstallKandoSchema = CommonAppSchema.extend({
  networkSeed: z.string(),
});

export type InstallKando = z.infer<typeof InstallKandoSchema>;

export const InstallHappInputSchema = InstallKandoSchema.extend({
  filePath: z.string(),
});

export type InstallHappInput = z.infer<typeof InstallHappInputSchema>;

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
  version: HolochainVersionSchema,
  holochainDataRoot: HolochainDataRootSchema,
});

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
  | '';
