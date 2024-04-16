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
	APP_STORE_HAPPS_QUERY_KEY,
	APP_STORE_MY_HAPPS_QUERY_KEY,
	APP_VERSIONS_DETAILS_QUERY_KEY,
	MY_HAPPS_ALL_VERSIONS_QUERY_KEY,
	PUBLISHERS_QUERY_KEY
} from '$const';
import { uint8ArrayToURIComponent } from '$helpers';
import { happVersionsSchema } from '$schemas';
import { getAppStoreClient, getDevHubClient } from '$services';
import {
	APP_STORE_CLIENT_NOT_INITIALIZED_ERROR,
	DEV_HUB_CLIENT_NOT_INITIALIZED_ERROR,
	NO_AVAILABLE_HOST_FOR_REMOTE_CALL,
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

export const createAppVersionsQuery = () => (apphub_hrl: Uint8Array) => {
	return createQuery({
		queryKey: [MY_HAPPS_ALL_VERSIONS_QUERY_KEY, apphub_hrl],
		queryFn: async () => {
			const devHubClient = getDevHubClientOrThrow();
			const webappPackageEntryEntity =
				await devHubClient.appHubZomeClient.getWebappPackageEntry(apphub_hrl);

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
						id: uint8ArrayToURIComponent(app.id),
						apphubHrlTarget: app.content.apphub_hrl.target,
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

export const createAppVersionsDetailsQuery = () => (apphub_hrl: Uint8Array) => {
	return createQuery({
		queryKey: [APP_VERSIONS_DETAILS_QUERY_KEY, apphub_hrl],
		queryFn: async () => {
			const appStoreClient = getAppStoreClientOrThrow();
			const devHubClient = getDevHubClientOrThrow();
			const devHubDnaHash = await devHubClient.apphubDnaHash();

			const webPackageZomeFunctionDetails = {
				dna: devHubDnaHash,
				zome: 'apphub_csr',
				function: 'get_webapp_package_versions'
			};

			const availableHost = await appStoreClient.portalZomeClient.getAvailableHostForZomeFunction(
				webPackageZomeFunctionDetails
			);

			if (!availableHost) {
				throw new Error(NO_AVAILABLE_HOST_FOR_REMOTE_CALL);
			}

			const webAppPackageEntryAddress = apphub_hrl;

			const webAppPackageVersionEntries = await appStoreClient.portalZomeClient.tryWithHosts(
				async (host) => {
					const callInput = {
						host,
						call: {
							dna: devHubDnaHash,
							zome: 'apphub_csr',
							function: 'get_webapp_package_versions',
							payload: webAppPackageEntryAddress
						}
					};
					return appStoreClient.portalZomeClient.customRemoteCall(callInput);
				},
				webPackageZomeFunctionDetails,
				4000
			);

			const parsedResult = happVersionsSchema.safeParse(webAppPackageVersionEntries);

			return parsedResult.success ? Object.keys(parsedResult.data) : [];
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
						id: uint8ArrayToURIComponent(app.id),
						apphubHrlTarget: app.content.apphub_hrl.target
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

			const appEntry = await devHubClient.saveWebapp(bytes);
			const webappPackageVersion = await devHubClient.appHubZomeClient.createWebappPackageVersion({
				for_package: webappPackageId,
				version,
				webapp: appEntry.address
			});

			await devHubClient.appHubZomeClient.createWebappPackageLinkToVersion({
				version,
				webapp_package_id: webappPackageId,
				webapp_package_version_addr: webappPackageVersion.action
			});
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: [MY_HAPPS_ALL_VERSIONS_QUERY_KEY] })
	});
};
