/* eslint-disable @typescript-eslint/no-explicit-any */
import localforage from 'localforage';

/**
 * This is a Class acts as a unified accessor for all things stored in
 * [localforage](https://www.npmjs.com/package/localforage).
 */
export class LauncherPersistedStore {
	private store: LocalforageStore;

	constructor(store?: LocalforageStore) {
		this.store = store ? store : new LocalforageStore();
	}

	/**
	 * Stores the allowlist from the given URL in localStorage for it to be
	 * available also without internet access.
	 */
	allowList: SubStore<string, string, [string]> = {
		value: async (url) => this.store.getItem<string>(`allowList${url}`),
		set: async (value, url) => this.store.setItem<string>(`allowList${url}`, value)
	};

	/**
	 * Stores that the Quick Setup option was chosen in case that setup
	 * fails and the user restarts when lair keystore is already initialized.
	 * Launcher will directly continue with the Quick Setup steps after
	 * entering the password in this case.
	 */
	quickSetupChosen: SubStore<boolean, boolean, []> = {
		value: () => this.store.getItem<boolean>('quickSetupChosen'),
		set: (value) => this.store.setItem<boolean>('quickSetupChosen', value)
	};
}

export interface SubStore<T, U, V extends any[]> {
	value: (...args: V) => Promise<T | null>;
	set: (value: U, ...args: V) => Promise<U>;
}

export class LocalforageStore {
	getItem = async <T>(key: string): Promise<T | null> => localforage.getItem(key) as Promise<T>;

	setItem = async <T>(key: string, value: T): Promise<T> => localforage.setItem(key, value);

	removeItem = async (key: string) => localforage.removeItem(key);

	clear = async () => localforage.clear();

	keys = async () => localforage.keys();
}
