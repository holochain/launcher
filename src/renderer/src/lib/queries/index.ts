import { useQueryClient } from '@tanstack/svelte-query';

import {
	createAppDetailsQuery,
	createAppStoreHappsQuery,
	createAppStoreMyHappsQuery,
	createAppVersionsQuery,
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
	const appVersionsQueryFunction = createAppVersionsQuery();
	const appDetailsQueryFunction = createAppDetailsQuery();
	const publisherMutation = createPublisherMutation(queryClient);
	const publishHappMutation = createPublishHappMutation(queryClient);
	const publishNewVersionMutation = createPublishNewVersionMutation(queryClient);

	return {
		publishersQuery,
		publisherMutation,
		publishHappMutation,
		appStoreMyHappsQuery,
		appVersionsQueryFunction,
		appDetailsQueryFunction,
		publishNewVersionMutation,
		appStoreHappsQuery
	};
}
