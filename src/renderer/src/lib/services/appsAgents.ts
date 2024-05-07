import { AppWebsocket } from '@holochain/client';
import { AppstoreAppClient, DevhubAppClient } from 'appstore-tools';
import { get, type Writable, writable } from 'svelte/store';

const appStoreClientStore = writable<AppstoreAppClient | null>(null);
const devHubClientStore = writable<DevhubAppClient | null>(null);

const createAppClient = async <T>(
	port: number,
	token: number[],
	clientConstructor: new (client: AppWebsocket) => T,
	store: Writable<T | null>
): Promise<void> => {
	if (get(store)) return;
	const client = await AppWebsocket.connect({ url: new URL(`ws://127.0.0.1:${port}`), token });
	const appClient = new clientConstructor(client);
	store.set(appClient);
};

export const createAppStoreClient = (port: number, token: number[]) =>
	createAppClient<AppstoreAppClient>(port, token, AppstoreAppClient, appStoreClientStore);

export const getAppStoreClient = () => appStoreClientStore;

export const createDevHubClient = (port: number, token: number[]) =>
	createAppClient<DevhubAppClient>(port, token, DevhubAppClient, devHubClientStore);

export const getDevHubClient = () => devHubClientStore;
