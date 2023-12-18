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
  installed_app_id: z.string(),
  agent_pub_key: z.instanceof(Uint8Array),
  version: HolochainVersionSchema,
  partition: z.string(),
});

export type ExtendedAppInfo = z.infer<typeof ExtendedAppInfoSchema>;

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
