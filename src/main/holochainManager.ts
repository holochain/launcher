/* eslint-disable @typescript-eslint/no-var-requires */
import { AdminWebsocket, AppInfo } from '@holochain/client';
import * as childProcess from 'child_process';
import fs from 'fs';
import getPort from 'get-port';
import path from 'path';
import split from 'split';

import {
  APP_INSTALLED,
  HOLOCHAIN_ERROR,
  HOLOCHAIN_LOG,
  HolochainDataRoot,
  HolochainPartition,
  HolochainVersion,
} from '../types';
import { HOLOCHAIN_BINARIES } from './binaries';
import { createDirIfNotExists, LauncherFileSystem } from './filesystem';
import { LauncherEmitter } from './launcherEmitter';
import { breakingVersion } from './utils';

const rustUtils = require('hc-launcher-rust-utils');

export type AdminPort = number;
export type AppPort = number;

const DEFAULT_BOOTSTRAP_SERVER = 'https://bootstrap.holo.host';
const DEFAULT_SIGNALING_SERVER = 'wss://signal.holo.host';

export class HolochainManager {
  processHandle: childProcess.ChildProcessWithoutNullStreams | undefined;
  adminPort: AdminPort;
  appPort: AppPort;
  adminWebsocket: AdminWebsocket;
  fs: LauncherFileSystem;
  installedApps: AppInfo[];
  launcherEmitter: LauncherEmitter;
  version: HolochainVersion;
  holochainDataRoot: HolochainDataRoot;

  constructor(
    processHandle: childProcess.ChildProcessWithoutNullStreams | undefined,
    launcherEmitter: LauncherEmitter,
    launcherFileSystem: LauncherFileSystem,
    adminPort: AdminPort,
    appPort: AppPort,
    adminWebsocket: AdminWebsocket,
    installedApps: AppInfo[],
    version: HolochainVersion,
    holochainDataRoot: HolochainDataRoot,
  ) {
    this.processHandle = processHandle;
    this.launcherEmitter = launcherEmitter;
    this.adminPort = adminPort;
    this.appPort = appPort;
    this.adminWebsocket = adminWebsocket;
    this.fs = launcherFileSystem;
    this.installedApps = installedApps;
    this.version = version;
    this.holochainDataRoot = holochainDataRoot;
  }

  static async launch(
    launcherEmitter: LauncherEmitter,
    launcherFileSystem: LauncherFileSystem,
    password: string,
    version: HolochainVersion,
    lairUrl: string,
    bootstrapUrl?: string,
    signalingUrl?: string,
    nonDefaultPartition?: HolochainPartition, // launch with data from a non-default partition
  ): Promise<HolochainManager> {
    let holochainDataRoot: HolochainDataRoot;
    switch (nonDefaultPartition?.type) {
      case 'custom':
        holochainDataRoot = {
          type: 'partition',
          name: `partition#${nonDefaultPartition.name}`,
        };
        break;
      case 'external':
        holochainDataRoot = {
          type: 'external',
          name: `external#${nonDefaultPartition.name}`,
          path: nonDefaultPartition.path,
        };
        break;
      default:
        if (version.type !== 'built-in')
          throw new Error('Only built-in holochain binaries can be used in the default partition.');
        holochainDataRoot = {
          type: 'partition',
          name: breakingVersion(version.version),
        };
        break;
    }

    if (version.type === 'running-external') {
      try {
        // TODO move this logic to where the zome call signer needs to connect.
        // const conductorConfigString = fs.readFileSync(version.configPath, 'utf-8');
        // const lairUrl = conductorConfigString
        //   .replace('connectionUrl:', '')
        //   .trim()
        //   .replaceAll('"', '');
        const adminWebsocket = await AdminWebsocket.connect(
          new URL(`ws://127.0.0.1:${version.adminPort}`),
        );
        console.log('Connected to admin websocket of externally running conductor.');
        const installedApps = await adminWebsocket.listApps({});
        const appInterfaces = await adminWebsocket.listAppInterfaces();
        console.log('Got appInterfaces: ', appInterfaces);
        let appPort;
        if (appInterfaces.length > 0) {
          appPort = appInterfaces[0];
        } else {
          const attachAppInterfaceResponse = await adminWebsocket.attachAppInterface({});
          console.log('Attached app interface port: ', attachAppInterfaceResponse);
          appPort = attachAppInterfaceResponse.port;
        }
        return new HolochainManager(
          undefined,
          launcherEmitter,
          launcherFileSystem,
          version.adminPort,
          appPort,
          adminWebsocket,
          installedApps,
          version,
          holochainDataRoot,
        );
      } catch (e) {
        throw new Error(`Failed to connect to external holochain binary: ${JSON.stringify(e)}`);
      }
    }
    const partitionName = holochainDataRoot.name;

    createDirIfNotExists(path.join(launcherFileSystem.holochainDir, partitionName));

    const adminPort = await getPort();

    const conductorEnvironmentPath = launcherFileSystem.conductorEnvironmentDir(partitionName);
    const configPath = launcherFileSystem.conductorConfigPath(partitionName);
    console.log('configPath: ', configPath);

    if (fs.existsSync(configPath)) {
      // TODO Reuse existing config and only overwrite chosen values if necessary
      const conductorConfigNew = rustUtils.defaultConductorConfig(
        adminPort,
        conductorEnvironmentPath,
        lairUrl,
        bootstrapUrl ? bootstrapUrl : DEFAULT_BOOTSTRAP_SERVER,
        signalingUrl ? signalingUrl : DEFAULT_SIGNALING_SERVER,
      );
      console.log('Overwriting new conductor-config.yaml...');
      fs.writeFileSync(configPath, conductorConfigNew);
    } else {
      const conductorConfig = rustUtils.defaultConductorConfig(
        adminPort,
        conductorEnvironmentPath,
        lairUrl,
        bootstrapUrl ? bootstrapUrl : DEFAULT_BOOTSTRAP_SERVER,
        signalingUrl ? signalingUrl : DEFAULT_SIGNALING_SERVER,
      );
      console.log(typeof conductorConfig);
      console.log('Writing new conductor-config.yaml...');
      fs.writeFileSync(configPath, conductorConfig);
    }

    const binary = version.type === 'built-in' ? HOLOCHAIN_BINARIES[version.version] : version.path;
    console.log('HOLOCHAIN_BINARIES: ', HOLOCHAIN_BINARIES);
    console.log('HOLOCHAIN BINARY: ', binary);
    const conductorHandle = childProcess.spawn(binary, ['-c', configPath, '-p'], {
      env: {
        RUST_LOG: 'info',
      },
    });
    conductorHandle.stdin.write(password);
    conductorHandle.stdin.end();
    conductorHandle.stdout.pipe(split()).on('data', async (line: string) => {
      launcherEmitter.emit(HOLOCHAIN_LOG, {
        version,
        holochainDataRoot,
        data: line,
      });
    });
    conductorHandle.stderr.pipe(split()).on('data', (line: string) => {
      launcherEmitter.emit(HOLOCHAIN_ERROR, {
        version,
        holochainDataRoot,
        data: line,
      });
    });

    return new Promise((resolve, reject) => {
      conductorHandle.stdout.pipe(split()).on('data', async (line: string) => {
        if (line.includes('FATAL PANIC PanicInfo')) {
          reject(
            `Holochain version ${JSON.stringify(
              version,
            )} failed to start up and crashed. Check the logs for details.`,
          );
        }
        if (line.includes('Conductor ready.')) {
          const adminWebsocket = await AdminWebsocket.connect(
            new URL(`ws://127.0.0.1:${adminPort}`),
          );
          console.log('Connected to admin websocket.');
          const installedApps = await adminWebsocket.listApps({});
          const appInterfaces = await adminWebsocket.listAppInterfaces();
          console.log('Got appInterfaces: ', appInterfaces);
          let appPort;
          if (appInterfaces.length > 0) {
            appPort = appInterfaces[0];
          } else {
            const attachAppInterfaceResponse = await adminWebsocket.attachAppInterface({});
            console.log('Attached app interface port: ', attachAppInterfaceResponse);
            appPort = attachAppInterfaceResponse.port;
          }
          resolve(
            new HolochainManager(
              conductorHandle,
              launcherEmitter,
              launcherFileSystem,
              adminPort,
              appPort,
              adminWebsocket,
              installedApps,
              version,
              holochainDataRoot,
            ),
          );
        }
      });
    });
  }

  // TODO Add option to install happ without UI
  async installWebHapp(webHappPath: string, appId: string, networkSeed?: string) {
    const uiTargetDir = this.fs.happUiDir(appId, this.holochainDataRoot);
    console.log('uiTargetDir: ', uiTargetDir);
    console.log('Installing app...');
    const tempHappPath = await rustUtils.saveWebhapp(webHappPath, uiTargetDir);
    console.log('Stored UI and got temp happ path: ', tempHappPath);
    const pubKey = await this.adminWebsocket.generateAgentPubKey();
    const appInfo = await this.adminWebsocket.installApp({
      agent_key: pubKey,
      installed_app_id: appId,
      membrane_proofs: {},
      path: tempHappPath,
      network_seed: networkSeed,
    });
    await this.adminWebsocket.enableApp({ installed_app_id: appId });
    console.log('Insalled app.');
    const installedApps = await this.adminWebsocket.listApps({});
    console.log('Installed apps: ', installedApps);
    this.installedApps = installedApps;
    this.launcherEmitter.emit(APP_INSTALLED, {
      version: this.version,
      holochainDataRoot: this.holochainDataRoot,
      data: appInfo,
    });
  }

  async uninstallApp(appId: string) {
    await this.adminWebsocket.uninstallApp({ installed_app_id: appId });
    fs.rmSync(this.fs.happUiDir(appId, this.holochainDataRoot), { recursive: true });
    console.log('Uninstalled app.');
    const installedApps = await this.adminWebsocket.listApps({});
    console.log('Installed apps: ', installedApps);
    this.installedApps = installedApps;
  }
}
