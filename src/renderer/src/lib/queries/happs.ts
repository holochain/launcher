import type { ActionHash } from '@holochain/client';
// @ts-expect-error the @spartan-hc/bundles package has no typescript types
import { Bundle } from '@spartan-hc/bundles';
import { createMutation, createQuery, QueryClient } from '@tanstack/svelte-query';
import type {
	AppstoreAppClient,
	BundleHashes,
	CreatePublisherFrontendInput,
	DevhubAppClient
} from 'appstore-tools';
import { sha256 } from 'js-sha256';
import { get, type Writable } from 'svelte/store';

import {
	ALL_APP_VERSIONS_APPSTORE_QUERY_KEY,
	ALL_APP_VERSIONS_DEVHUB_QUERY_KEY,
	APP_STORE_HAPPS_QUERY_KEY,
	APP_STORE_MY_HAPPS_QUERY_KEY,
	PUBLISHERS_QUERY_KEY
} from '$const';
import { getAppStoreClient, getDevHubClient } from '$services';
import {
	APP_STORE_CLIENT_NOT_INITIALIZED_ERROR,
	DEV_HUB_CLIENT_NOT_INITIALIZED_ERROR,
	NO_PUBLISHERS_AVAILABLE_ERROR
} from '$shared/types';
import type { AppData, PublishNewVersionData } from '$types';

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

/**
 * Gets the versions that have been published to app store
 * @returns
 */
export const createAppVersionsAppstoreQuery = () => (appEntryId: ActionHash) => {
	return createQuery({
		queryKey: [ALL_APP_VERSIONS_APPSTORE_QUERY_KEY, appEntryId],
		queryFn: async () => {
			const appstoreClient = getAppStoreClientOrThrow();

			const appVersions = await appstoreClient.appstoreZomeClient.getAppVersionsForApp(appEntryId);

			return appVersions;
		}
	});
};

/**
 * Get the versions that have been created in devhub
 * @returns
 */
export const createAppVersionsDevhubQuery = () => (webappPackageEntryId: ActionHash) => {
	return createQuery({
		queryKey: [ALL_APP_VERSIONS_DEVHUB_QUERY_KEY, webappPackageEntryId],
		queryFn: async () => {
			const devHubClient = getDevHubClientOrThrow();
			const webappPackageEntryEntity =
				await devHubClient.appHubZomeClient.getWebappPackageEntry(webappPackageEntryId);

			const versions = await devHubClient.appHubZomeClient.getWebappPackageVersions(
				webappPackageEntryEntity.id
			);

			// TODO distinguish here between version that are only stored in devhub vs. versions
			// that are also stored in appstore. Currently we assume that all versions stored in
			// devhub

			return { versions, webapp_package_id: webappPackageEntryEntity.id };
		}
	});
};

export const createAppStoreMyHappsQuery = () => {
	return createQuery({
		queryKey: [APP_STORE_MY_HAPPS_QUERY_KEY],
		queryFn: async () => {
			const myApps = await getAppStoreClientOrThrow().appstoreZomeClient.getMyApps();
			const appsWithIcons = await Promise.all(
				myApps.map(async (app) => {
					const icon = await getDevHubClientOrThrow().appHubMereMemoryZomeClient.getMereMemoryBytes(
						app.content.icon
					);

					return {
						id: app.id,
						title: app.content.title,
						subtitle: app.content.subtitle,
						icon
					};
				})
			);
			return appsWithIcons;
		}
	});
};

export const createAppStoreHappsQuery = () => {
	return createQuery({
		queryKey: [APP_STORE_HAPPS_QUERY_KEY],
		queryFn: async () => {
			const appStoreClient = getAppStoreClientOrThrow();
			const myApps = await appStoreClient.appstoreZomeClient.getAllApps();

			const appsWithIcons = await Promise.all(
				myApps.map(async (app) => {
					const icon = await appStoreClient.mereMemoryZomeClient.getMereMemoryBytes(
						app.content.icon
					);

					return {
						title: app.content.title,
						subtitle: app.content.subtitle,
						icon,
						id: app.id
					};
				})
			);
			return appsWithIcons;
		}
	});
};

export const createPublisherMutation = (queryClient: QueryClient) => {
	return createMutation({
		mutationFn: (createPublisherInput: CreatePublisherFrontendInput) =>
			getAppStoreClientOrThrow().createPublisher(createPublisherInput),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: [PUBLISHERS_QUERY_KEY] })
	});
};

export const createPublishHappMutation = (queryClient: QueryClient) => {
	return createMutation({
		mutationFn: async ({ title, subtitle, description, icon, bytes, version }: AppData) => {
			const devHubClient = getDevHubClientOrThrow();
			const appStoreClient = getAppStoreClientOrThrow();

			// TODO validate that the bytes are of a valid webhapp format

			// Compute hashes before saving to ensure to not save the bytes if hashing fails
			const webhappHash = sha256.hex(bytes);
			const webappBundle = new Bundle(bytes, 'webhapp');
			const uiHash = sha256.hex(webappBundle.ui());
			const happHash = sha256.hex(
				webappBundle.resources[webappBundle.manifest.happ_manifest.bundled]
			);
			const hashes: BundleHashes = {
				hash: webhappHash,
				ui_hash: uiHash,
				happ_hash: happHash
			};

			const appEntry = await devHubClient.saveWebapp(bytes);
			const webappPackage = await devHubClient.createWebappPackage({
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
				webapp_package_version_addr: webappPackageVersion.action
			});

			// TODO takes this as an input to the query instead of deriving it here
			// in order to have it work in case of multiple publishers
			const publishers = await appStoreClient.appstoreZomeClient.getMyPublishers();
			if (publishers.length === 0) {
				throw new Error(NO_PUBLISHERS_AVAILABLE_ERROR);
			}

			// Compute bundle hashes
			const apphubDnaHash = await devHubClient.apphubDnaHash();

			// TODO add icon size validation before attempting a zome call in the first place, e.g.
			// crop the image to the maximum size of 200KB

			const appEntryEntity = await appStoreClient.createApp({
				title,
				subtitle,
				description,
				icon,
				publisher: publishers[0].id,
				apphub_hrl: {
					dna: apphubDnaHash,
					target: webappPackage.id
				},
				// This entry hash needs to be verified upon receiving the WebAppPackage entry via remote calls
				apphub_hrl_hash: webappPackage.address
			});

			try {
				await appStoreClient.appstoreZomeClient.createAppVersion({
					version,
					for_app: appEntryEntity.id,
					apphub_hrl: {
						dna: apphubDnaHash,
						target: webappPackageVersion.id
					},
					apphub_hrl_hash: webappPackageVersion.address,
					bundle_hashes: hashes
				});
			} catch (error) {
				console.error(error);
			}
		},
		onSuccess: () =>
			queryClient.invalidateQueries({
				queryKey: [APP_STORE_MY_HAPPS_QUERY_KEY, APP_STORE_HAPPS_QUERY_KEY]
			})
	});
};

export const createPublishNewVersionMutation = (queryClient: QueryClient) => {
	return createMutation({
		mutationFn: async ({ bytes, version, webappPackageId }: PublishNewVersionData) => {
			const devHubClient = getDevHubClientOrThrow();
			const appStoreClient = getAppStoreClientOrThrow();

			// TODO validate that the bytes are of a valid webhapp format

			// Compute hashes before saving to ensure to not save the bytes if hashing fails
			const webhappHash = sha256.hex(bytes);
			const webappBundle = new Bundle(bytes, 'webhapp');
			const uiHash = sha256.hex(webappBundle.ui());
			const happHash = sha256.hex(
				webappBundle.resources[webappBundle.manifest.happ_manifest.bundled]
			);
			const hashes: BundleHashes = {
				hash: webhappHash,
				ui_hash: uiHash,
				happ_hash: happHash
			};

			const appEntryEntity = await devHubClient.saveWebapp(bytes);

			const webappPackageVersion = await devHubClient.appHubZomeClient.createWebappPackageVersion({
				for_package: webappPackageId,
				version,
				webapp: appEntryEntity.address
			});

			await devHubClient.appHubZomeClient.createWebappPackageLinkToVersion({
				version,
				webapp_package_id: webappPackageId,
				webapp_package_version_addr: webappPackageVersion.action
			});

			const apphubDnaHash = await devHubClient.apphubDnaHash();

			console.log('apphubDnaHash', apphubDnaHash);

			try {
				await appStoreClient.appstoreZomeClient.createAppVersion({
					version,
					for_app: appEntryEntity.id,
					apphub_hrl: {
						dna: apphubDnaHash,
						target: webappPackageVersion.id
					},
					apphub_hrl_hash: webappPackageVersion.address,
					bundle_hashes: hashes
				});
			} catch (error) {
				console.error(error);
			}
		},
		onSuccess: () =>
			queryClient.invalidateQueries({
				queryKey: [ALL_APP_VERSIONS_DEVHUB_QUERY_KEY, ALL_APP_VERSIONS_APPSTORE_QUERY_KEY]
			})
	});
};
