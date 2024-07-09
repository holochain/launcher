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
    deleteRecursively(this.profileDataDir);
  }
}

export function createDirIfNotExists(path: fs.PathLike) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true });
  }
}

/**
 * Deletes a folder recursively and if a file or folder fails with an EPERM error,
 * it deletes all other folders
 * @param root
 */
export function deleteRecursively(root: string) {
  try {
    console.log('Attempting to remove file or folder: ', root);
    fs.rmSync(root, { recursive: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    if (e.toString && e.toString().includes('EPERM')) {
      console.log('Got EPERM error for file or folder: ', root);
      if (fs.statSync(root).isDirectory()) {
        console.log('Removing files and subfolders.');
        const filesAndSubFolders = fs.readdirSync(root);
        filesAndSubFolders.forEach((file) => deleteRecursively(file));
      } else {
        console.log('fs.statSync(root): ', fs.statSync(root));
      }
    }
  }
}
