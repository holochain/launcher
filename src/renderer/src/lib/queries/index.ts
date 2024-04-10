import { useQueryClient } from '@tanstack/svelte-query';

import {
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
	const appVersionsQueryFunction = createAppVersionsQuery();
	const publisherMutation = createPublisherMutation(queryClient);
	const publishHappMutation = createPublishHappMutation(queryClient);
	const publishNewVersionMutation = createPublishNewVersionMutation(queryClient);

	return {
		publishersQuery,
		publisherMutation,
		publishHappMutation,
		appStoreMyHappsQuery,
		appVersionsQueryFunction,
		publishNewVersionMutation
	};
}
