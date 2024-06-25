import type { App } from 'electron';
import fs from 'fs';
import path from 'path';

import type { DistributionInfoV1, HolochainDataRoot } from '$shared/types';

import { type IntegrityChecker } from './integrityChecker';
import { breakingVersion } from './utils';

export type Profile = string;

/**
 * Version 1 of app metadata structure.
 */
export type AppMetadataV1 = {
  type: 'webhapp' | 'headless';
  happ: {
    sha256: string;
    dnas?: unknown; // sha256 hashes of dnas and zomes
  };
  ui?: {
    location:
      | {
          type: 'filesystem';
          sha256: string; // Also defines the foldername where the unzipped assets are stored
        }
      | {
          type: 'localhost';
          port: number;
        };
  };
  /**
   * Alias for that app in case user wants to change the name of this app displayed after installation
   */
  alias?: string;
  /**
   * Info about where the app has been installed from
   */
  distributionInfo: DistributionInfoV1;
};

export type AppMetadata<T> = {
  /**
   * Version number of the format of the data to be able to update
   * the format without losing backwards compatibility
   */
  formatVersion: number;
  data: T;
};

export type LauncherConfig = {
  backupLocation?: string;
};

export class LauncherFileSystem {
  public profileDataDir: string;
  public profileLogsDir: string;
  public profile: string;
  integrityChecker: IntegrityChecker | undefined;

  constructor(profileDataDir: string, profileLogsDir: string, profile: string) {
    this.profileDataDir = profileDataDir;
    this.profileLogsDir = profileLogsDir;
    this.profile = profile;
  }

  static connect(app: App, profile?: Profile) {
    const breakingAppVersion = breakingVersion(app.getVersion());
    profile = profile ? profile : 'default';

    const defaultLogsPath = app.getPath('logs');
    console.log('defaultLogsPath: ', defaultLogsPath);
    // app.setPath('logs', path.join(defaultLogsPath, profile));
    const defaultUserDataPath = app.getPath('userData');
    console.log('defaultUserDataPath: ', defaultUserDataPath);
    // check whether userData path has already been modified, otherwise, set paths to point
    // to the profile-specific paths
    if (!defaultUserDataPath.endsWith(profile)) {
      app.setPath('logs', path.join(defaultUserDataPath, breakingAppVersion, profile, 'logs'));
      app.setAppLogsPath(path.join(defaultUserDataPath, breakingAppVersion, profile, 'logs'));
      app.setPath('userData', path.join(defaultUserDataPath, breakingAppVersion, profile));
      app.setPath(
        'sessionData',
        path.join(defaultUserDataPath, breakingAppVersion, profile, 'chromium'),
      );
      fs.rmdirSync(defaultLogsPath);
    }

    const profileDataDir = app.getPath('userData');
    const profileLogsDir = app.getPath('logs');

    const launcherFileSystem = new LauncherFileSystem(profileDataDir, profileLogsDir, profile);

    launcherFileSystem.createInitialDirectoryStructure();
    return launcherFileSystem;
  }

  createInitialDirectoryStructure = () => {
    createDirIfNotExists(this.keystoreDir);
    createDirIfNotExists(this.holochainDir);
    createDirIfNotExists(this.configDir);
  };

  setIntegrityChecker(integrityChecker: IntegrityChecker) {
    this.integrityChecker = integrityChecker;
  }

  get keystoreDir() {
    return path.join(this.profileDataDir, 'lair');
  }

  get holochainDir() {
    return path.join(this.profileDataDir, 'holochain');
  }

  get configDir() {
    return path.join(this.profileDataDir, 'config');
  }

  holochainPartitionDir(partitionName: string) {
    return path.join(this.holochainDir, partitionName);
  }

  conductorConfigPath(partitionName: string) {
    return path.join(this.holochainDir, partitionName, 'conductor-config.yaml');
  }

  conductorEnvironmentDir(partitionName: string) {
    return path.join(this.holochainDir, partitionName, 'dbs');
  }

  /**
   * This is the directory in which app metadata is stored like the UI associated to the
   * app and the sha256 hash of the .happ file that belongs to it or potentially an alias
   * for the installed_app_id
   *
   * @param holochainDataRoot
   * @returns
   */
  appsDir(holochainDataRoot: HolochainDataRoot) {
    return path.join(this.holochainDataBase(holochainDataRoot), 'apps');
  }

  /**
   * This is the directory in which .happ files are being stored to not have to refetch
   * .happ files over the network if they have already been installed earlier
   *
   * @param holochainDataRoot
   * @returns
   */
  happsDir(holochainDataRoot: HolochainDataRoot) {
    return path.join(this.holochainDataBase(holochainDataRoot), 'happs');
  }

  /**
   * This is the directory where UI assets are stored. UI assets are stored
   * in folders named by the sha256 hash of the ui.zip they are originating from
   * which results in deduplication in case multiple apps use the same UI and
   * allows to not have to refetch a UI over the network if the same UI is already
   * used by another app instance.
   * It also opens questions around garbage collection if no app is using a
   * certain UI anymore.
   *
   * @param holochainDataRoot
   * @returns
   */
  uisDir(holochainDataRoot: HolochainDataRoot) {
    return path.join(this.holochainDataBase(holochainDataRoot), 'uis');
  }

  /**
   * Directory where metadata of an app instance is stored. For example which UI
   * it currently uses.
   *
   * @param appId
   * @param holochainDataRoot
   * @returns
   */
  appMetadataDir(appId: string, holochainDataRoot: HolochainDataRoot) {
    return path.join(this.appsDir(holochainDataRoot), appId);
  }

  /**
   * Reads the sha256 hash of the ui zip file to determine the directory
   * where the UI assets for the specified app are stored
   *
   * @param appId
   * @param holochainDataRoot
   * @returns
   */
  appUiDir(appId: string, holochainDataRoot: HolochainDataRoot): string {
    if (!this.integrityChecker) throw new Error('IntegrityCheker not set.');
    const metadataPath = path.join(this.appMetadataDir(appId, holochainDataRoot), 'info.json');
    const appMetaData =
      this.integrityChecker.readSignedJSON<AppMetadata<AppMetadataV1>>(metadataPath);
    if (!appMetaData.data.ui || appMetaData.data.ui.location.type !== 'filesystem')
      throw new Error('App seems to be headless or the metadata file is malformed.');
    const uiSha256 = appMetaData.data.ui.location.sha256;
    return path.join(this.uisDir(holochainDataRoot), uiSha256);
  }

  holochainDataBase(holochainDataRoot: HolochainDataRoot) {
    return holochainDataRoot.type === 'partition'
      ? this.holochainPartitionDir(holochainDataRoot.name)
      : holochainDataRoot.path;
  }

  keystoreInitialized = () => {
    return fs.existsSync(path.join(this.keystoreDir, 'lair-keystore-config.yaml'));
  };

  factoryReset(keepLogs = false) {
    if (keepLogs) throw new Error('Keeping logs across factory reset is currently not supported.');
    fs.rmSync(this.profileDataDir, { recursive: true });
  }

  get launcherConfigPath() {
    return path.join(this.configDir, 'launcher-config.json');
  }

  get launcherConfig(): LauncherConfig | undefined {
    if (fs.existsSync(this.launcherConfigPath)) {
      const configStr = fs.readFileSync(this.launcherConfigPath, 'utf-8');
      return JSON.parse(configStr) as LauncherConfig;
    }
    return undefined;
  }

  /**
   *
   * @param path
   * @returns
   */
  setBackupLocation(path: string) {
    if (!fs.existsSync(path)) {
      throw new Error(
        'The specified path does not exist. The backup location must be set to an existing directory.',
      );
    }
    if (!fs.statSync(path).isDirectory()) {
      throw new Error('The backup location must point to a directory.');
    }
    const launcherConfig = this.launcherConfig;
    if (launcherConfig) {
      launcherConfig.backupLocation = path;
      return launcherConfig;
    } else {
      const launcherConfig = {
        backupLocation: path,
      };
      fs.writeFileSync(this.launcherConfigPath, JSON.stringify(launcherConfig));
      return launcherConfig;
    }
  }

  get backupLocation() {
    const launcherConfig = this.launcherConfig;
    if (launcherConfig) {
      return launcherConfig.backupLocation;
    }
    return undefined;
  }

  /**
   * Backs up all relevant data required for a full recovery of launcher in its current state
   */
  async backupFullState() {
    const backupLocation = this.backupLocation;
    if (!backupLocation)
      throw new Error('Failed to backup launcher data. No backup location defined.');
    const backupRoot = path.join(backupLocation, 'launcher-backup');
    createDirIfNotExists(backupRoot);
    const start = Date.now();
    // 1. back up all lair related data
    // function that starts at the leaves, overwrites directory by directory by copying it over
    fs.cp(this.keystoreDir, path.join(backupRoot, 'lair'), { recursive: true }, (err) => {
      if (err?.message.includes('socket file')) {
        // socket file cannot and does not need to be copied
        return;
      }
      throw Error(`Failed to copy keystore directory: ${err}`);
    });

    fs.cp(
      this.holochainDir,
      path.join(backupRoot, 'holochain'),
      { recursive: true, filter: (src, _dst) => !src.endsWith('wasm-cache') },
      (err) => {
        if (err) {
          throw Error(`Failed to copy holochain directory: ${err}`);
        }
        console.log('Copying took ', Date.now() - start, 'ms');
      },
    );

    // Store information about last successful backup, i.e. timestamp
  }

  async restoreFromBackup(backupRoot: string) {
    const backupHolochainDir = path.join(backupRoot, 'holochain');
    const backupLairDir = path.join(backupRoot, 'lair');
    if (!fs.existsSync(backupHolochainDir)) {
      throw new Error('Incomplete backup. Holochain data is missing.');
    }
    if (!fs.existsSync(backupLairDir)) {
      throw new Error('Incomplete backup. Lair data is missing.');
    }
    if (fs.readdirSync(this.holochainDir).length !== 0) {
      throw new Error('Existing holochain directory is not empty');
    }
    if (fs.readdirSync(this.keystoreDir).length !== 0) {
      throw new Error('Existing keystore directory is not empty');
    }

    // fs.cp(backupLairDir, this.keystoreDir, { recursive: true }, (err) => {
    //   if (err) throw Error(`Failed to copy lair backup: ${err.message}`);
    //   console.log('COPIED LAIR FOLDER.');
    // });
    // fs.cp(backupHolochainDir, this.holochainDir, { recursive: true }, (err) => {
    //   if (err) throw Error(`Failed to copy holochain backup: ${err.message}`);
    //   console.log('COPIED HOLOCHAIN FOLDER.');
    // });

    fs.cpSync(backupLairDir, this.keystoreDir, { recursive: true });
    fs.cpSync(backupHolochainDir, this.holochainDir, { recursive: true });
  }
}

export function createDirIfNotExists(path: fs.PathLike) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true });
  }
}
