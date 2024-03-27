import { AppAgentWebsocket } from '@holochain/client';
import { AppstoreAppClient, DevhubAppClient } from 'appstore-tools';
import { type Writable, writable } from 'svelte/store';

import { APP_STORE_APP_ID, DEVHUB_APP_ID } from '$shared/const';

const appStoreClientStore = writable<AppstoreAppClient | null>(null);
const devHubClientStore = writable<DevhubAppClient | null>(null);

const createClient = (port: number, appId: string) =>
	AppAgentWebsocket.connect(new URL(`ws://127.0.0.1:${port}`), appId, 100000);

const createAppClient = async <T>(
	port: number,
	appId: string,
	clientConstructor: new (client: AppAgentWebsocket) => T,
	store: Writable<T | null>
): Promise<void> => {
	const client = await createClient(port, appId);
	const appClient = new clientConstructor(client);
	store.set(appClient);
};

export const createAppStoreClient = (port: number) =>
	createAppClient<AppstoreAppClient>(
		port,
		APP_STORE_APP_ID,
		AppstoreAppClient,
		appStoreClientStore
	);

export const getAppStoreClient = () => appStoreClientStore;

export const createDevHubClient = (port: number) =>
	createAppClient<DevhubAppClient>(port, DEVHUB_APP_ID, DevhubAppClient, devHubClientStore);

export const getDevHubClient = () => devHubClientStore;
