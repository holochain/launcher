import path from 'path';
import type winston from 'winston';
import { createLogger, format, transports } from 'winston';

import type { HolochainData } from '$shared/types';
import {
  HOLOCHAIN_ERROR,
  HOLOCHAIN_LOG,
  LAIR_ERROR,
  LAIR_LOG,
  LAUNCHER_ERROR,
  LAUNCHER_LOG,
  WASM_LOG,
} from '$shared/types';

import type { LauncherFileSystem } from './filesystem';
import type { LauncherEmitter } from './launcherEmitter';

const { combine, timestamp } = format;

const HOLOCHAIN_LOGGERS: Record<string, winston.Logger> = {}; // loggers by holochain partition

// TODO define class LauncherLogger that can log all lair, holochain and launcher-specific stuff
// with methods logLair, logHolochain, logLauncher, logHapp, ...

export function setupLogs(
  launcherEmitter: LauncherEmitter,
  launcherFileSystem: LauncherFileSystem,
) {
  const logFilePath = path.join(launcherFileSystem.profileLogsDir, 'launcher.log');
  const logFileTransport = new transports.File({
    filename: logFilePath,
    maxsize: 50_000_000,
    maxFiles: 5,
  });
  const launcherLogger = createLauncherLogger(logFileTransport);
  const lairLogger = createLairLogger(logFileTransport);

  launcherEmitter.on(LAUNCHER_ERROR, (log) => {
    const logLine = `[LAUNCHER] ERROR: ${log}`;
    console.log(logLine);
    launcherLogger.log('error', logLine);
  });
  launcherEmitter.on(LAUNCHER_LOG, (log) => {
    const logLine = `[LAUNCHER]: ${log}`;
    console.log(logLine);
    launcherLogger.log('error', logLine);
  });
  launcherEmitter.on(LAIR_LOG, (log) => {
    const logLine = `[LAIR] ${log}`;
    console.log(logLine);
    lairLogger.log('info', logLine);
  });
  launcherEmitter.on(LAIR_ERROR, (log) => {
    const logLine = `[LAIR] ERROR: ${log}`;
    console.log(logLine);
    lairLogger.log('info', logLine);
  });
  launcherEmitter.on(HOLOCHAIN_LOG, (holochainData) => {
    logHolochain(holochainData as HolochainData, logFileTransport, launcherFileSystem.profile);
  });
  launcherEmitter.on(HOLOCHAIN_ERROR, (holochainData) => {
    logHolochain(holochainData as HolochainData, logFileTransport, launcherFileSystem.profile);
  });
  launcherEmitter.on(WASM_LOG, (holochainData) => {
    logHolochain(holochainData as HolochainData, logFileTransport, launcherFileSystem.profile);
  });
}

function logHolochain(
  holochainData: HolochainData,
  logFileTransport: winston.transports.FileTransportInstance,
  profile: string,
) {
  const holochainPartition = holochainData.holochainDataRoot.name;
  const identifier = identifierFromHolochainData(holochainData);
  const line = (holochainData as HolochainData).data;
  const logLine = `[${identifier}]${profile !== 'default' ? `[profile: ${profile}]` : ''}: ${line}`;
  console.log(logLine);
  let logger = HOLOCHAIN_LOGGERS[holochainPartition];
  if (logger) {
    logger.log('info', line);
  } else {
    logger = createHolochainLogger(identifier, logFileTransport);
    HOLOCHAIN_LOGGERS[holochainPartition] = logger;
    logger.log('info', line);
  }
}

function createHolochainLogger(
  label: string,
  logFileTransport: winston.transports.FileTransportInstance,
): winston.Logger {
  return createLogger({
    transports: [logFileTransport],
    format: combine(
      timestamp(),
      format.printf(({ level, message, timestamp }) => {
        return JSON.stringify({
          timestamp,
          label,
          level,
          message,
        });
      }),
    ),
  });
}

function createLauncherLogger(
  logFileTransport: winston.transports.FileTransportInstance,
): winston.Logger {
  return createLogger({
    transports: [logFileTransport],
    format: combine(
      timestamp(),
      format.printf(({ level, message, timestamp }) => {
        return JSON.stringify({
          timestamp,
          label: 'LAUNCHER',
          level,
          message,
        });
      }),
    ),
  });
}

function createLairLogger(
  logFileTransport: winston.transports.FileTransportInstance,
): winston.Logger {
  return createLogger({
    transports: [logFileTransport],
    format: combine(
      timestamp(),
      format.printf(({ level, message, timestamp }) => {
        return JSON.stringify({
          timestamp,
          label: 'LAIR',
          level,
          message,
        });
      }),
    ),
  });
}

function identifierFromHolochainData(holochainData: HolochainData): string {
  if (holochainData.version.type === 'built-in') {
    return `HOLOCHAIN ${holochainData.version.version} @ partition ${holochainData.holochainDataRoot.name}`;
  } else if (holochainData.version.type === 'custom-path') {
    return `HOLOCHAIN CUSTOM BINARY @ partition ${holochainData.holochainDataRoot.name}`;
  } else if (holochainData.version.type === 'running-external') {
    return `HOLOCHAIN EXTERNAL BINARY @ partition ${holochainData.holochainDataRoot.name}`;
  } else {
    return `HOLOCHAIN unknown`;
  }
}
