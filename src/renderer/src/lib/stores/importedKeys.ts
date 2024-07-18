import { writable } from 'svelte/store';

export const importedKeys = writable<string[]>([]);
