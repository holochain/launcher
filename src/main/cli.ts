import fs from 'fs';

import type { HolochainVersion } from '../types';
import { DEFAULT_HOLOCHAIN_VERSION, LAIR_BINARY } from './binaries';

export type CliArgs = {
  profile?: string;
  holochainPath?: string;
  lairBinaryPath?: string;
  useDefaultPartition?: boolean;
  adminPort?: number;
  lairUrl?: string;
  appsDataDir?: string;
  bootstrapUrl?: string;
  signalingUrl?: string;
  rustLog?: string;
  wasmLog?: string;
};

export type ValidatedCliArgs = {
  profile: string | undefined;
  holochainVersion: HolochainVersion;
  lairBinaryPath: string;
  useDefaultPartition: boolean;
  bootstrapUrl: string | undefined;
  signalingUrl: string | undefined;
  rustLog: string | undefined;
  wasmLog: string | undefined;
};

export function validateArgs(args: CliArgs): ValidatedCliArgs {
  const allowedProfilePattern = /^[0-9a-zA-Z-]+$/;
  if (args.profile && !allowedProfilePattern.test(args.profile)) {
    throw new Error(
      `The --profile argument may only contain digits (0-9), letters (a-z,A-Z) and dashes (-) but got '${args.profile}'`,
    );
  }
  if (args.appsDataDir && !args.adminPort) {
    console.warn(
      'WARN: The --apps-data-dir option is only taken into accound when using an external binary (--admin-port).',
    );
  }
  if (args.lairUrl) {
    console.warn(
      'WARN: The --lair-url option is only taken into accound when using an external binary (--admin-port).',
    );
  }
  if (args.useDefaultPartition && !args.holochainPath) {
    throw new Error(
      'The --use-default-partition flag is only valid in combination with the --holochain-path option.',
    );
  }

  let holochainVersion: HolochainVersion = {
    type: 'built-in',
    version: DEFAULT_HOLOCHAIN_VERSION,
  };
  if (args.holochainPath) {
    if (!fs.existsSync(args.holochainPath)) {
      throw new Error('No file found at the path provided via --holochain-path');
    }
    if (args.adminPort) {
      throw new Error(
        'External binary (--admin-port) and custom binary (--holochain-path) are not supported to be run at the same time.',
      );
    }
    holochainVersion = {
      type: 'custom-path',
      path: args.holochainPath,
    };
  }
  if (args.lairBinaryPath) {
    if (!fs.existsSync(args.lairBinaryPath)) {
      throw new Error('No file found at the path provided via --lair-binary-path');
    }
    if (args.adminPort) {
      throw new Error(
        'If you specify an external binary (--admin-port) the --lair-binary-path option is invalid as you have to provide your own lair instance and pass its url via --lair-url',
      );
    }
  }
  if (args.adminPort) {
    if (typeof args.adminPort !== 'number') {
      throw new Error('The value passed to the --admin-port option must be a number.');
    }
    if (!args.appsDataDir) {
      throw new Error(
        'The --apps-data-dir option must be provided as well if the --admin-port option is specified.',
      );
    }
    if (!args.lairUrl) {
      throw new Error(
        'The --lair-url option must be provided as well if the --admin-port option is specified.',
      );
    }
    if (!fs.existsSync(args.appsDataDir)) {
      throw new Error('The path provided via --apps-data-dir does not seem to exist.');
    }
    holochainVersion = {
      type: 'running-external',
      adminPort: args.adminPort,
      appsDataDir: args.appsDataDir,
      lairUrl: args.lairUrl,
    };
  }

  if (args.bootstrapUrl && args.adminPort) {
    console.warn(
      'WARN: The --bootstrap-url argument is ignored when running an external binary (--admin-port).',
    );
  }
  if (args.bootstrapUrl && args.adminPort) {
    console.warn(
      'WARN: The --signaling-url argument is ignored when running an external binary (--admin-port).',
    );
  }

  const profile = args.profile ? args.profile : undefined;

  const bootstrapUrl = args.bootstrapUrl && !args.adminPort ? args.bootstrapUrl : undefined;
  const signalingUrl = args.signalingUrl && !args.adminPort ? args.signalingUrl : undefined;

  return {
    profile,
    holochainVersion,
    lairBinaryPath: args.lairBinaryPath ? args.lairBinaryPath : LAIR_BINARY,
    useDefaultPartition: args.useDefaultPartition ? true : false,
    bootstrapUrl,
    signalingUrl,
    rustLog: args.rustLog ? args.rustLog : undefined,
    wasmLog: args.wasmLog ? args.wasmLog : undefined,
  };
}
