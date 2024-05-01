import * as childProcess from 'child_process';
import fs from 'fs';
import { nanoid } from 'nanoid';
import os from 'os';
import path from 'path';
import split from 'split';

import { getErrorMessage } from '$shared/helpers';
import {
  FAILED_TO_CREATE_SYMLINKED_LAIR_DIRECTORY_ERROR,
  INITIALIZE_LAIR_KEYSTORE_ERROR,
  LAIR_ERROR,
  LAIR_LOG,
  LAIR_READY,
  LAUNCH_LAIR_KEYSTORE_ERROR,
  LOADING_PROGRESS_UPDATE,
  WRONG_PASSWORD,
} from '$shared/types';

import type { LauncherEmitter } from './launcherEmitter';
import { throwTRPCErrorError } from './utils';

function waitForLairKeystore(
  launcherEmitter: LauncherEmitter,
  lairHandle: childProcess.ChildProcessWithoutNullStreams,
): Promise<[childProcess.ChildProcessWithoutNullStreams, string]> {
  return new Promise((resolve, reject) => {
    launcherEmitter.on(LAIR_READY, (url) => resolve([lairHandle, url as string]));
    launcherEmitter.on(LAIR_ERROR, (err) => {
      reject(new Error(err));
    });
  });
}

export async function initializeLairKeystore(
  lairBinary: string,
  keystoreDir: string,
  launcherEmitter: LauncherEmitter,
  password: string,
): Promise<void> {
  try {
    const lairHandle = childProcess.spawn(lairBinary, ['init', '-p'], { cwd: keystoreDir });
    lairHandle.stdin.write(password);
    lairHandle.stdin.end();
    return new Promise((resolve) => {
      let killAfterNextLine = false;
      lairHandle.stdout.pipe(split()).on('data', (line: string) => {
        launcherEmitter.emit(LAIR_LOG, line);
        if (killAfterNextLine) {
          lairHandle.kill();
          resolve();
        }
        if (line.includes('# lair-keystore init config')) {
          killAfterNextLine = true;
        }
      });
    });
  } catch (error) {
    launcherEmitter.emit(LOADING_PROGRESS_UPDATE, '');
    throwTRPCErrorError({
      message: INITIALIZE_LAIR_KEYSTORE_ERROR,
      cause: error,
    });
  }
}

export async function launchLairKeystore(
  lairBinary: string,
  keystoreDir: string,
  launcherEmitter: LauncherEmitter,
  password: string,
): Promise<[childProcess.ChildProcessWithoutNullStreams, string]> {
  // On Unix systems, there is a limit to the path length of a domain socket. Create a symlink to the lair directory
  // from the tempdir instead and overwrite the connectionUrl in the lair-keystore-config.yaml

  try {
    if (os.platform() === 'linux' || os.platform() === 'darwin') {
      const uid = nanoid(13);
      const srcPath = path.join(os.tmpdir(), `lair.${uid}`);
      fs.symlinkSync(keystoreDir, srcPath);
      keystoreDir = srcPath;
      const lairConfigPath = path.join(keystoreDir, 'lair-keystore-config.yaml');
      const lairConfigString = fs.readFileSync(lairConfigPath, 'utf-8');
      const lines = lairConfigString.split('\n');
      const idx = lines.findIndex((line) => line.includes('connectionUrl:'));
      if (idx === -1)
        throwTRPCErrorError({
          message: FAILED_TO_CREATE_SYMLINKED_LAIR_DIRECTORY_ERROR,
          cause: new Error('Failed to find connectionUrl line in lair-keystore-config.yaml.'),
        });
      const connectionUrlLine = lines[idx];
      const socket = connectionUrlLine.split('socket?')[1];
      const tmpDirConnectionUrl = `unix://${keystoreDir}/socket?${socket}`;
      lines[idx] = `connectionUrl: ${tmpDirConnectionUrl}`;
      const newLairConfigString = lines.join('\n');
      fs.writeFileSync(lairConfigPath, newLairConfigString);
    }

    const lairHandle = childProcess.spawn(lairBinary, ['server', '-p'], { cwd: keystoreDir });
    lairHandle.stdin.write(password);
    lairHandle.stdin.end();
    // Wait for connection url or internal sodium error and return error or EventEmitter
    lairHandle.stderr.pipe(split()).on('data', (line: string) => {
      launcherEmitter.emit(LAIR_ERROR, line);
    });
    lairHandle.stdout.pipe(split()).on('data', (line: string) => {
      launcherEmitter.emit(LAIR_LOG, line);
      if (line.includes('# lair-keystore connection_url #')) {
        const connectionUrl = line.split('#')[2].trim();
        launcherEmitter.emit(LAIR_READY, connectionUrl);
      }
    });

    return await waitForLairKeystore(launcherEmitter, lairHandle);
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    launcherEmitter.emit(LOADING_PROGRESS_UPDATE, '');
    if (errorMessage.includes('InternalSodium')) {
      return throwTRPCErrorError({ message: WRONG_PASSWORD, cause: error });
    }
    throwTRPCErrorError({ message: LAUNCH_LAIR_KEYSTORE_ERROR, cause: error });
  }
}
