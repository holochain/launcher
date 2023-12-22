import { TRPCError } from '@trpc/server';
import { BrowserWindow, shell } from 'electron';
import semver from 'semver';

import { ErrorWithMessage } from '../types';

export function setLinkOpenHandlers(browserWindow: BrowserWindow): void {
  // links in happ windows should open in the system default application
  // instead of the webview
  browserWindow.webContents.on('will-navigate', (e) => {
    console.log('GOT WILL-NAVIGATE EVENT: ', e);
    if (e.url === 'http://localhost:5173/') {
      // ignore vite routing in dev mode
      return;
    }
    if (
      e.url.startsWith('http://') ||
      e.url.startsWith('https://') ||
      e.url.startsWith('mailto://')
    ) {
      e.preventDefault();
      shell.openExternal(e.url);
    }
  });

  // Links with target=_blank should open in the system default browser and
  // happ windows are not allowed to spawn new electron windows
  browserWindow.webContents.setWindowOpenHandler((details) => {
    console.log('GOT NEW WINDOW EVENT: ', details);
    if (details.url.startsWith('http://') || details.url.startsWith('https://')) {
      shell.openExternal(details.url);
    }
    return { action: 'deny' };
  });
}

export function throwTRPCErrorError({
  message,
  cause,
}: {
  message: string;
  cause?: unknown;
}): never {
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message,
    cause,
  });
}

export function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
  if (isErrorWithMessage(maybeError)) return maybeError;

  try {
    return new Error(JSON.stringify(maybeError));
  } catch {
    // fallback in case there's an error stringifying the maybeError
    // like with circular references for example.
    return new Error(String(maybeError));
  }
}

export function getErrorMessage(error: unknown) {
  return toErrorWithMessage(error).message;
}

export function breakingVersion(version) {
  if (!semver.valid(version)) {
    throw new Error('Version is not valid semver.');
  }

  if (semver.prerelease(version)) {
    return version;
  }

  const major = semver.major(version);
  const minor = semver.minor(version);
  const patch = semver.patch(version);

  return major === 0 ? (minor === 0 ? `0.0.${patch}` : `0.${minor}.x`) : `${major}.x.x`;
}
