import type { KeyFile } from 'hc-launcher-rust-utils';
import { type Writable, writable } from 'svelte/store';

export const appPassword: Writable<string> = writable('');
export const recoveryKeysPassphrase: Writable<string> = writable('');
export const generatedKeyRecoveryFile: Writable<KeyFile | undefined> = writable(undefined);
export const setupProgress: Writable<string> = writable('');
