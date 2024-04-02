import { createMutation, createQuery, QueryClient } from '@tanstack/svelte-query';
import type {
	AppstoreAppClient,
	CreatePublisherFrontendInput,
	DevhubAppClient
} from 'appstore-tools';
import { get, type Writable } from 'svelte/store';

import { getAppStoreClient, getDevHubClient } from '$services';
import {
	APP_STORE_CLIENT_NOT_INITIALIZED_ERROR,
	DEV_HUB_CLIENT_NOT_INITIALIZED_ERROR,
	NO_PUBLISHERS_AVAILABLE_ERROR
} from '$shared/types';
import type { AppData } from '$types';

export const PUBLISHERS_QUERY_KEY = 'publishers';
type ClientType = DevhubAppClient | AppstoreAppClient;

const getClientOrThrow = <T extends ClientType>(
	getClient: () => Writable<T | null>,
	error: string
): T => {
	const client = get(getClient());
	if (!client) {
		throw new Error(error);
	}
	return client;
};

const getAppStoreClientOrThrow = () =>
	getClientOrThrow(getAppStoreClient, APP_STORE_CLIENT_NOT_INITIALIZED_ERROR);
const getDevHubClientOrThrow = () =>
	getClientOrThrow(getDevHubClient, DEV_HUB_CLIENT_NOT_INITIALIZED_ERROR);

export const createPublishersQuery = () => {
	return createQuery({
		queryKey: [PUBLISHERS_QUERY_KEY],
		queryFn: () => getAppStoreClientOrThrow().appstoreZomeClient.getMyPublishers()
	});
};

export const createPublisherMutation = (queryClient: QueryClient) => {
	return createMutation({
		mutationFn: (createPublisherInput: CreatePublisherFrontendInput) =>
			getAppStoreClientOrThrow().createPublisher(createPublisherInput),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: [PUBLISHERS_QUERY_KEY] })
	});
};

export const createPublishHappMutation = () => {
	return createMutation({
		mutationFn: async ({ title, subtitle, description, icon, bytes, version }: AppData) => {
			const devHubClient = getDevHubClientOrThrow();
			const appStoreClient = getAppStoreClientOrThrow();
			const appEntry = await devHubClient.saveWebapp(bytes);
			const webappPackage = await devHubClient.appHubZomeClient.createWebappPackage({
				title,
				subtitle,
				description,
				icon
			});
			const webappPackageVersion = await devHubClient.appHubZomeClient.createWebappPackageVersion({
				for_package: webappPackage.id,
				version,
				webapp: appEntry.address
			});

			devHubClient.appHubZomeClient.createWebappPackageLinkToVersion({
				version,
				webapp_package_id: webappPackage.id,
				webapp_package_version_addr: webappPackageVersion.address
			});

			const publishers = await appStoreClient.appstoreZomeClient.getMyPublishers();
			if (publishers.length === 0) {
				throw new Error(NO_PUBLISHERS_AVAILABLE_ERROR);
			}

			await appStoreClient.appstoreZomeClient.createApp({
				title,
				subtitle,
				description,
				icon,
				publisher: publishers[0].id,
				apphub_hrl: {
					dna: await devHubClient.apphubDnaHash(),
					target: webappPackage.address
				}
			});
		}
	});
};
