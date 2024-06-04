import { type ActionHash, decodeHashFromBase64 } from '@holochain/client';
// @ts-expect-error the @spartan-hc/bundles package has no typescript types
import { Bundle } from '@spartan-hc/bundles';
import type { QueryClient } from '@tanstack/svelte-query';
import { createMutation, createQuery } from '@tanstack/svelte-query';
import {
	type AppstoreAppClient,
	type AppVersionEntry,
	type BundleHashes,
	bundleToDeterministicBytes,
	type CreatePublisherFrontendInput,
	type DevhubAppClient
} from 'appstore-tools';
import { sha256 } from 'js-sha256';
import { get, type Writable } from 'svelte/store';

import {
	ALL_APP_VERSIONS_APPSTORE_QUERY_KEY,
	ALL_APP_VERSIONS_DEVHUB_QUERY_KEY,
	APP_STORE_HAPPS_QUERY_KEY,
	APP_STORE_MY_HAPPS_QUERY_KEY,
	CHECK_FOR_APP_UI_UPDATES_QUERY_KEY,
	PUBLISHERS_QUERY_KEY
} from '$const';
import { uint8ArrayToURIComponent } from '$helpers';
import { getAppStoreClient, getDevHubClient } from '$services';
import {
	APP_STORE_CLIENT_NOT_INITIALIZED_ERROR,
	DEV_HUB_CLIENT_NOT_INITIALIZED_ERROR,
	NO_PUBLISHERS_AVAILABLE_ERROR
} from '$shared/types';
import { type AppData, type AppWithIcon, type PublishNewVersionData } from '$types';

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
	getClientOrThrow<AppstoreAppClient>(getAppStoreClient, APP_STORE_CLIENT_NOT_INITIALIZED_ERROR);
const getDevHubClientOrThrow = () =>
	getClientOrThrow<DevhubAppClient>(getDevHubClient, DEV_HUB_CLIENT_NOT_INITIALIZED_ERROR);

export const createPublishersQuery = () => {
	return createQuery({
		queryKey: [PUBLISHERS_QUERY_KEY],
		queryFn: () => getAppStoreClientOrThrow().appstoreZomeClient.getMyPublishers()
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
					const icon = await getDevHubClientOrThrow().appHubMereMemoryZomeClient.getMemoryBytes(
						app.content.icon
					);

					return {
						id: app.id,
						title: app.content.title,
						subtitle: app.content.subtitle,
						description: app.content.description,
						icon,
						apphubHrlTarget: app.content.apphub_hrl.target,
						apphubHrlHash: app.content.apphub_hrl.dna
					};
				})
			);
			return appsWithIcons;
		}
	});
};

export const createAppStoreHappsQuery = () => {
	return createQuery({
		refetchInterval: 10000,
		queryKey: [APP_STORE_HAPPS_QUERY_KEY],
		queryFn: async () => {
			const appStoreClient = getAppStoreClientOrThrow();
			const myApps = await appStoreClient.appstoreZomeClient.getAllApps();

			const appsWithIcons = await Promise.all(
				myApps.map(async (app) => {
					const icon = await appStoreClient.mereMemoryZomeClient.getMemoryBytes(app.content.icon);

					return {
						title: app.content.title,
						subtitle: app.content.subtitle,
						description: app.content.description,
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
			let webhappHash = sha256.hex(bytes);
			console.log('hash before bundling: ', webhappHash);
			const webappBundle = new Bundle(bytes, 'webhapp');
			const deterministicWebappBundleBytes = bundleToDeterministicBytes(webappBundle);
			const deterministicHappBundleBytes = bundleToDeterministicBytes(webappBundle.happ());

			webhappHash = sha256.hex(deterministicWebappBundleBytes);
			console.log('webhapp sha256 after bundling: ', webhappHash);
			const uiHash = sha256.hex(webappBundle.ui());
			const happHash = sha256.hex(deterministicHappBundleBytes);
			console.log('happ sha256: ', happHash);
			console.log('webapp manifest: ', webappBundle.manifest);
			console.log('happ manifest: ', webappBundle.happ().manifest);

			const hashes: BundleHashes = {
				hash: webhappHash,
				ui_hash: uiHash,
				happ_hash: happHash
			};

			const appEntry = await devHubClient.saveWebapp(deterministicWebappBundleBytes);
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

			return uint8ArrayToURIComponent(appEntryEntity.id);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [APP_STORE_MY_HAPPS_QUERY_KEY]
			});
			queryClient.invalidateQueries({
				queryKey: [APP_STORE_HAPPS_QUERY_KEY]
			});
		}
	});
};

export const createUpdateAppDetailsMutation = (queryClient: QueryClient) => {
	return createMutation({
		mutationFn: async ({
			title,
			subtitle,
			description,
			icon,
			apphubHrlTarget,
			apphubHrlHash,
			id
		}: AppWithIcon) => {
			const appStoreClient = getAppStoreClientOrThrow();
			const devHubClient = getDevHubClientOrThrow();

			const apphubDnaHash = await devHubClient.apphubDnaHash();

			await appStoreClient.updateApp({
				base: id,
				properties: {
					title,
					subtitle,
					description,
					icon,
					apphub_hrl: {
						dna: apphubDnaHash,
						target: apphubHrlTarget
					},
					apphub_hrl_hash: apphubHrlHash
				}
			});

			return uint8ArrayToURIComponent(id);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [APP_STORE_MY_HAPPS_QUERY_KEY]
			});
			queryClient.invalidateQueries({
				queryKey: [APP_STORE_HAPPS_QUERY_KEY]
			});
		}
	});
};

export const createPublishNewVersionMutation = (queryClient: QueryClient) => {
	return createMutation({
		mutationFn: async ({
			bytes,
			version,
			webappPackageId,
			appEntryId,
			previousHappHash
		}: PublishNewVersionData) => {
			const devHubClient = getDevHubClientOrThrow();
			const appStoreClient = getAppStoreClientOrThrow();

			// TODO validate that the bytes are of a valid webhapp format

			// Compute hashes before saving to ensure to not save the bytes if hashing fails
			let webhappHash = sha256.hex(bytes);
			console.log('hash before bundling: ', webhappHash);
			const webappBundle = new Bundle(bytes, 'webhapp');
			const deterministicWebappBundleBytes = bundleToDeterministicBytes(webappBundle);
			const deterministicHappBundleBytes = bundleToDeterministicBytes(webappBundle.happ());

			webhappHash = sha256.hex(deterministicWebappBundleBytes);
			const uiHash = sha256.hex(webappBundle.ui());
			const happHash = sha256.hex(deterministicHappBundleBytes);

			if (happHash !== previousHappHash)
				throw new Error(
					'happ sha256 does not match the happ sha256 of previous versions. Since coordinator zome updates are currently not supported, only app versions with the same happ file are allowed to be published under the same app entry'
				);

			const hashes: BundleHashes = {
				hash: webhappHash,
				ui_hash: uiHash,
				happ_hash: happHash
			};

			const devhubAppEntryEntity = await devHubClient.saveWebapp(bytes);

			const webappPackageVersion = await devHubClient.appHubZomeClient.createWebappPackageVersion({
				for_package: webappPackageId,
				version,
				webapp: devhubAppEntryEntity.address
			});

			await devHubClient.appHubZomeClient.createWebappPackageLinkToVersion({
				version,
				webapp_package_id: webappPackageId,
				webapp_package_version_addr: webappPackageVersion.action
			});

			const apphubDnaHash = await devHubClient.apphubDnaHash();

			await appStoreClient.appstoreZomeClient.createAppVersion({
				version,
				for_app: appEntryId,
				apphub_hrl: {
					dna: apphubDnaHash,
					target: webappPackageVersion.id
				},
				apphub_hrl_hash: webappPackageVersion.address,
				bundle_hashes: hashes
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [ALL_APP_VERSIONS_DEVHUB_QUERY_KEY] });
			queryClient.invalidateQueries({ queryKey: [ALL_APP_VERSIONS_APPSTORE_QUERY_KEY] });
			queryClient.invalidateQueries({ queryKey: [CHECK_FOR_APP_UI_UPDATES_QUERY_KEY] });
		}
	});
};

export const createFetchWebappBytesMutation = () => {
	return createMutation({
		mutationFn: async (appVersionEntry: AppVersionEntry): Promise<Uint8Array> => {
			const appStoreClient = getAppStoreClientOrThrow();
			return appStoreClient.fetchWebappBytes(appVersionEntry);
		}
	});
};

export const createFetchUiBytesMutation = () => {
	return createMutation({
		mutationFn: async (appVersionEntry: AppVersionEntry): Promise<Uint8Array> => {
			const appStoreClient = getAppStoreClientOrThrow();
			return appStoreClient.fetchUiBytes(appVersionEntry);
		}
	});
};

export const createCheckForAppUiUpdatesQuery = () => (appVersionActionHashes: string[]) => {
	return createQuery({
		queryKey: [CHECK_FOR_APP_UI_UPDATES_QUERY_KEY, appVersionActionHashes],
		queryFn: async () => {
			const appStoreClient = getAppStoreClientOrThrow();
			const distinctVersionHashes = appVersionActionHashes;
			const updates = await Promise.all(
				distinctVersionHashes.map(async (hash) => {
					const maybeUpdate = await appStoreClient.checkForUiUpdate(decodeHashFromBase64(hash!));
					return maybeUpdate ? { [hash]: maybeUpdate } : null;
				})
			);

			return updates.reduce((acc, update) => (update ? { ...acc, ...update } : acc), {});
		}
	});
};

/**
 * Gets the versions that have been published to app store
 * @returns
 */
export const createAppVersionsAppstoreQuery = () => (appEntryId?: ActionHash) => {
	if (!appEntryId) {
		return undefined;
	}
	return createQuery({
		queryKey: [ALL_APP_VERSIONS_APPSTORE_QUERY_KEY, appEntryId],
		queryFn: async () => {
			const appstoreClient = getAppStoreClientOrThrow();

			const appVersions = await appstoreClient.appstoreZomeClient.getAppVersionsForApp(appEntryId);

			return appVersions;
		}
	});
};
