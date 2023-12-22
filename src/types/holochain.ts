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
  }),
]);

export type HolochainVersion = z.infer<typeof HolochainVersionSchema>;

export const ExtendedAppInfoSchema = z.object({
  partition: z.string(),
  agent_pub_key: z.instanceof(Uint8Array),
  installed_app_id: z.string(),
  version: HolochainVersionSchema,
});

export type ExtendedAppInfo = z.infer<typeof ExtendedAppInfoSchema>;

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

export type HolochainData = {
  version: HolochainVersion;
  partition: string;
  data: unknown;
};

export type RunningHolochain = {
  version: HolochainVersion;
  partition: string;
  appPort: number;
};

export type LoadingProgressUpdate = 'startingLairKeystore' | 'startingHolochain';
