import { writable } from 'svelte/store';

import type { MainScreenRoute } from '../../../../types';

export const navigationStore = writable<MainScreenRoute | null>(null);
