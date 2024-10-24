import { type Writable, writable } from 'svelte/store';

import type { LauncherUpdate } from '$shared/types';

export const launcherUpdateAvailable: Writable<LauncherUpdate | undefined> = writable(undefined);
