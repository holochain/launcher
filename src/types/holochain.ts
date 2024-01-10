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

export type HolochainDataRoot =
  | {
      type: 'partition';
      /**
       * If it's a custom partition, it will start with 'partition#'
       */
      name: string;
    }
  | {
      /**
       * A partition that's not under control of the launcher but provided externally. Used when the launcher
       * connects to an externally running holochain binary
       */
      type: 'external';
      /**
       * The name is used to determine the storage location of localStorage and other browser-related data.
       * It will start with 'external#'.
       */
      name: string;
      /**
       * Path to use as data root
       */
      path: string;
    };

export type HolochainPartition =
  | {
      /**
       * The default partition. Its folder name is based on the holochain version, e.g. 0.2.x
       * for all holochain versions semver compatible with holochain 0.2.0
       */
      type: 'default';
    }
  | {
      /**
       * A custom partition with a custom name. Its folder name will be named partition#[cusom name here]
       */
      type: 'custom';
      name: string;
    }
  | {
      /**
       * A partition that's not under control of the launcher but provided externally. Used when the launcher
       * connects to an externally running holochain binary
       */
      type: 'external';
      /**
       * The name is used to determine the storage location of localStorage and other browser-related data
       */
      name: string;
      path: string;
    };

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
