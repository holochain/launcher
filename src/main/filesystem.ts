import { App } from 'electron';
import fs from 'fs';
import path from 'path';

import { HolochainDataRoot } from '../types';
import { breakingVersion } from './utils';

export type Profile = string;

export class LauncherFileSystem {
  public profileDataDir: string;
  public profileLogsDir: string;
  public profile: string;

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

  happUiDir(appId: string, holochainDataRoot: HolochainDataRoot) {
    const baseDir =
      holochainDataRoot.type === 'partition'
        ? this.holochainPartitionDir(holochainDataRoot.name)
        : holochainDataRoot.path;
    return path.join(baseDir, 'apps', appId, 'ui');
  }

  keystoreInitialized = () => {
    return fs.existsSync(path.join(this.keystoreDir, 'lair-keystore-config.yaml'));
  };

  // TODO
  // factoryReset = (deleteLogs: boolean) => {};
}

export function createDirIfNotExists(path: fs.PathLike) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true });
  }
}
