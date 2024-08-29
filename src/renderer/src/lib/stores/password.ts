import type { KeyFile } from 'hc-launcher-rust-utils';
import { writable, type Writable } from 'svelte/store';

export const appPassword: Writable<string> = writable('');
export const recoveryKeysPassphrase: Writable<string> = writable('');
export const generatedKeyRecoveryFile: Writable<KeyFile | undefined> = writable(undefined);
