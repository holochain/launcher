import { type AppAuthenticationToken, AppWebsocket } from '@holochain/client';
import { AppstoreAppClient, DevhubAppClient } from 'appstore-tools';
import { type Writable, writable } from 'svelte/store';

declare global {
	interface Window {
		__APPSTORE_APP_TOKEN__: AppAuthenticationToken;
		__DEVHUB_APP_TOKEN__: AppAuthenticationToken;
	}
}

const appStoreClientStore = writable<AppstoreAppClient | null>(null);
const devHubClientStore = writable<DevhubAppClient | null>(null);

const createAppClient = async <T>(
	port: number,
	token: AppAuthenticationToken,
	clientConstructor: new (client: AppWebsocket) => T,
	store: Writable<T | null>
): Promise<void> => {
	const client = await AppWebsocket.connect({ url: new URL(`ws://127.0.0.1:${port}`), token });
	const appClient = new clientConstructor(client);
	store.set(appClient);
};

export const createAppStoreClient = (port: number, token: AppAuthenticationToken) =>
	createAppClient<AppstoreAppClient>(port, token, AppstoreAppClient, appStoreClientStore);

export const getAppStoreClient = () => appStoreClientStore;

export const createDevHubClient = (port: number, token: AppAuthenticationToken) =>
	createAppClient<DevhubAppClient>(port, token, DevhubAppClient, devHubClientStore);

export const getDevHubClient = () => devHubClientStore;
