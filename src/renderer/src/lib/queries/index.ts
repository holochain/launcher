import { useQueryClient } from '@tanstack/svelte-query';

import {
	createAppStoreHappsQuery,
	createAppStoreMyHappsQuery,
	createAppVersionsAppstoreQuery,
	createCheckForAppUiUpdatesQuery,
	createFetchUiBytesMutation,
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
		checkForAppUiUpdatesQuery
	};
}
