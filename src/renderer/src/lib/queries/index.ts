import { useQueryClient } from '@tanstack/svelte-query';

import {
	createAppStoreHappsQuery,
	createAppStoreMyHappsQuery,
	createAppVersionsAppstoreQuery,
	createCheckForAppUiUpdatesQuery,
	createFetchAllowlistQuery,
	createFetchUiBytesMutation,
	createGetAppDetailsQuery,
	createPublisherMutation,
	createPublishersQuery,
	createPublishHappMutation,
	createPublishNewVersionMutation,
	createUpdateAppDetailsMutation
} from './happs';

export function createAppQueries() {
	const queryClient = useQueryClient();
	const publishersQuery = createPublishersQuery();
	const appStoreMyHappsQuery = createAppStoreMyHappsQuery();
	const appStoreHappsQuery = createAppStoreHappsQuery();
	const appVersionsAppstoreQueryFunction = createAppVersionsAppstoreQuery();
	const publisherMutation = createPublisherMutation(queryClient);
	const publishHappMutation = createPublishHappMutation(queryClient);
	const updateAppDetailsMutation = createUpdateAppDetailsMutation(queryClient);
	const publishNewVersionMutation = createPublishNewVersionMutation(queryClient);
	const checkForAppUiUpdatesQuery = createCheckForAppUiUpdatesQuery();
	const getAppDetailsQuery = createGetAppDetailsQuery();
	const fetchAllowlistQuery = createFetchAllowlistQuery();
	const fetchUiBytesMutation = createFetchUiBytesMutation();

	return {
		publishersQuery,
		publisherMutation,
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
