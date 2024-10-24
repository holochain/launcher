import { type ActionHash, decodeHashFromBase64, encodeHashToBase64 } from '@holochain/client';
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
	type DeprecateInput,
	type DevhubAppClient,
	type UpdateAppFrontendInput,
	type UpdatePublisherFrontendInput
} from 'appstore-tools';
import type { UpdateEntityInput } from 'appstore-tools/dist/types.js';
import { sha256 } from 'js-sha256';
import { get, type Writable } from 'svelte/store';

import {
	ALL_APP_VERSIONS_APPSTORE_QUERY_KEY,
	ALL_APP_VERSIONS_DEVHUB_QUERY_KEY,
	APP_STORE_HAPPS_QUERY_KEY,
	APP_STORE_MY_HAPPS_QUERY_KEY,
	CHECK_FOR_APP_UI_UPDATES_QUERY_KEY,
	FETCH_ALLOWLIST_QUERY_KEY,
	GET_APP_DETAILS_QUERY_KEY,
	PUBLISHERS_QUERY_KEY
} from '$const';
import { fetchFilterLists, uint8ArrayToURIComponent } from '$helpers';
import { getAppStoreClient, getDevHubClient } from '$services';
import {
	APP_STORE_CLIENT_NOT_INITIALIZED_ERROR,
	DEV_HUB_CLIENT_NOT_INITIALIZED_ERROR,
	NO_PUBLISHERS_AVAILABLE_ERROR
} from '$shared/types';
import { type AppData, type PublishNewVersionData } from '$types';
import { HolochainFoundationList } from '$types/happs';

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
		queryFn: () => getAppStoreClientOrThrow().getMyPublishers()
	});
};

export const createGetPublisherQuery = () => (publisherEntityId?: ActionHash) => {
	if (!publisherEntityId) {
		return undefined;
	}
	return createQuery({
		queryKey: [encodeHashToBase64(publisherEntityId)],
		queryFn: () => getAppStoreClientOrThrow().getPublisher(publisherEntityId)
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

export const createAppStoreMyAppsQuery = () => {
	return createQuery({
		queryKey: [APP_STORE_MY_HAPPS_QUERY_KEY],
		queryFn: async () => {
			return getAppStoreClientOrThrow().getMyApps();
		}
	});
};

export const createGetAllAppsQuery = () => {
	return createQuery({
		refetchInterval: 10000,
		queryKey: [APP_STORE_HAPPS_QUERY_KEY],
		queryFn: async () => {
			const appStoreClient = getAppStoreClientOrThrow();
			return appStoreClient.getAllApps();
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

export const createUpdatePublisherMutation = (queryClient: QueryClient) => {
	return createMutation({
		mutationFn: (updatePublisherInput: UpdateEntityInput<UpdatePublisherFrontendInput>) =>
			getAppStoreClientOrThrow().updatePublisher(updatePublisherInput),
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
		mutationFn: async (input: UpdateEntityInput<UpdateAppFrontendInput>) => {
			return getAppStoreClientOrThrow().updateApp(input);
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

export const createDeprecateAppMutation = (queryClient: QueryClient) => {
	return createMutation({
		mutationFn: async (input: DeprecateInput) => {
			return getAppStoreClientOrThrow().appstoreZomeClient.deprecateApp(input);
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
					'happ sha256 does not match the happ sha256 of previous versions. Since coordinator zome updates are currently not supported, only app versions with the same .happ file are allowed to be published in subsequent releases for the same app.'
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

export const createFetchUiBytesMutation = () => {
	return createMutation({
		mutationFn: async (appVersionEntry: AppVersionEntry): Promise<Uint8Array> => {
			const appStoreClient = getAppStoreClientOrThrow();
			return appStoreClient.fetchUiBytes(appVersionEntry);
		}
	});
};

export const createCheckForAppUiUpdatesQuery =
	() => (appVersionActionHashes: string[], isDev: boolean) => {
		return createQuery({
			queryKey: [CHECK_FOR_APP_UI_UPDATES_QUERY_KEY, appVersionActionHashes],
			queryFn: async () => {
				console.log('Checking for UI updates...');
				const appStoreClient = getAppStoreClientOrThrow();
				const distinctVersionHashes = appVersionActionHashes;
				const filterLists = await fetchFilterLists(appStoreClient, isDev);
				const updates = await Promise.all(
					distinctVersionHashes.map(async (hash) => {
						let maybeUpdate;
						try {
							maybeUpdate = await appStoreClient.checkForUiUpdate(
								decodeHashFromBase64(hash!),
								filterLists.allowlists[HolochainFoundationList.value],
								filterLists.denylist
							);
						} catch (e) {
							console.error('Failed to check for UI update: ', e);
						}
						return maybeUpdate ? { [hash]: maybeUpdate } : null;
					})
				);
				console.log('Got updates: ', updates);
				return updates.reduce((acc, update) => (update ? { ...acc, ...update } : acc), {});
			}
		});
	};

export const createGetAppDetailsQuery = () => (actionHash: Uint8Array) => {
	return createQuery({
		queryKey: [GET_APP_DETAILS_QUERY_KEY, actionHash],
		queryFn: async () => {
			const appStoreClient = getAppStoreClientOrThrow();
			const appDetails = await appStoreClient.getAppDetails(actionHash);
			return appDetails;
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

export const createFetchAllowlistQuery = () => (isDev: boolean) => {
	return createQuery({
		queryKey: [FETCH_ALLOWLIST_QUERY_KEY],
		queryFn: async () => {
			const appstoreClient = getAppStoreClientOrThrow();
			const filterLists = await fetchFilterLists(appstoreClient, isDev);
			return filterLists;
		}
	});
};
