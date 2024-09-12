import { useQueryClient } from '@tanstack/svelte-query';

import {
	createAppStoreMyAppsQuery,
	createAppVersionsAppstoreQuery,
	createCheckForAppUiUpdatesQuery,
	createFetchAllowlistQuery,
	createFetchUiBytesMutation,
	createGetAllAppsQuery,
	createGetAppDetailsQuery,
	createGetPublisherQuery,
	createPublisherMutation,
	createPublishersQuery,
	createPublishHappMutation,
	createPublishNewVersionMutation,
	createUpdateAppDetailsMutation,
	createUpdatePublisherMutation
} from './happs';

export function createAppQueries() {
	const queryClient = useQueryClient();
	const publishersQuery = createPublishersQuery();
	const getPublisherQueryFunction = createGetPublisherQuery();
	const appStoreMyAppsQuery = createAppStoreMyAppsQuery();
	const appStoreAllAppsQuery = createGetAllAppsQuery();
	const appVersionsAppstoreQueryFunction = createAppVersionsAppstoreQuery();
	const publisherMutation = createPublisherMutation(queryClient);
	const updatePublisherMutation = createUpdatePublisherMutation(queryClient);
	const publishHappMutation = createPublishHappMutation(queryClient);
	const updateAppDetailsMutation = createUpdateAppDetailsMutation(queryClient);
	const publishNewVersionMutation = createPublishNewVersionMutation(queryClient);
	const checkForAppUiUpdatesQuery = createCheckForAppUiUpdatesQuery();
	const getAppDetailsQuery = createGetAppDetailsQuery();
	const fetchAllowlistQuery = createFetchAllowlistQuery();
	const fetchUiBytesMutation = createFetchUiBytesMutation();

	return {
		publishersQuery,
		getPublisherQueryFunction,
		publisherMutation,
		updatePublisherMutation,
		publishHappMutation,
		appStoreMyAppsQuery,
		updateAppDetailsMutation,
		appVersionsAppstoreQueryFunction,
		publishNewVersionMutation,
		appStoreAllAppsQuery,
		fetchUiBytesMutation,
		getAppDetailsQuery,
		fetchAllowlistQuery,
		checkForAppUiUpdatesQuery
	};
}
