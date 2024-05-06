import { useQueryClient } from '@tanstack/svelte-query';

import {
	createAppStoreHappsQuery,
	createAppStoreMyHappsQuery,
	createAppVersionsAppstoreQuery,
	createCheckForAppUiUpdatesQuery,
	createFetchUiBytesMutation,
	createFetchWebappBytesMutation,
	createPublisherMutation,
	createPublishersQuery,
	createPublishHappMutation,
	createPublishNewVersionMutation
} from './happs';

export function createAppQueries() {
	const queryClient = useQueryClient();
	const publishersQuery = createPublishersQuery();
	const appStoreMyHappsQuery = createAppStoreMyHappsQuery();
	const appStoreHappsQuery = createAppStoreHappsQuery();
	const appVersionsAppstoreQueryFunction = createAppVersionsAppstoreQuery();
	const fetchWebappBytesMutation = createFetchWebappBytesMutation();
	const publisherMutation = createPublisherMutation(queryClient);
	const publishHappMutation = createPublishHappMutation(queryClient);
	const publishNewVersionMutation = createPublishNewVersionMutation(queryClient);
	const checkForAppUiUpdatesQuery = createCheckForAppUiUpdatesQuery();
	const fetchUiBytesMutation = createFetchUiBytesMutation();

	return {
		publishersQuery,
		publisherMutation,
		publishHappMutation,
		appStoreMyHappsQuery,
		appVersionsAppstoreQueryFunction,
		publishNewVersionMutation,
		fetchWebappBytesMutation,
		appStoreHappsQuery,
		fetchUiBytesMutation,
		checkForAppUiUpdatesQuery
	};
}
