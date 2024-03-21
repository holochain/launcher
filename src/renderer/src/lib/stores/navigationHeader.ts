import { writable } from 'svelte/store';

import type { MainScreenRoute } from '$shared/types';

export const navigationStore = writable<MainScreenRoute | null>(null);
