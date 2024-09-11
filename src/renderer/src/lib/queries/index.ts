import { useQueryClient } from '@tanstack/svelte-query';

import {
	createAppStoreHappsQuery,
	createAppStoreMyHappsQuery,
	createAppVersionsAppstoreQuery,
	createCheckForAppUiUpdatesQuery,
	createFetchAllowlistQuery,
	createFetchUiBytesMutation,
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
	const appStoreMyHappsQuery = createAppStoreMyHappsQuery();
	const appStoreHappsQuery = createAppStoreHappsQuery();
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
		appStoreMyHappsQuery,
		updateAppDetailsMutation,
		appVersionsAppstoreQueryFunction,
		publishNewVersionMutation,
		appStoreHappsQuery,
		fetchUiBytesMutation,
		getAppDetailsQuery,
		fetchAllowlistQuery,
		checkForAppUiUpdatesQuery
	};
}
