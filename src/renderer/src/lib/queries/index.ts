import { useQueryClient } from '@tanstack/svelte-query';

import {
	createAppStoreHappsQuery,
	createAppStoreMyHappsQuery,
	createAppVersionsAppstoreQuery,
	createFetchWebappBytesQuery,
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
	const fetchWebappBytesQuery = createFetchWebappBytesQuery();
	const publisherMutation = createPublisherMutation(queryClient);
	const publishHappMutation = createPublishHappMutation(queryClient);
	const publishNewVersionMutation = createPublishNewVersionMutation(queryClient);

	return {
		publishersQuery,
		publisherMutation,
		publishHappMutation,
		appStoreMyHappsQuery,
		appVersionsAppstoreQueryFunction,
		publishNewVersionMutation,
		fetchWebappBytesQuery,
		appStoreHappsQuery
	};
}
