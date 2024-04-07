import { useQueryClient } from '@tanstack/svelte-query';

import {
	createAppStoreMyHappsQuery,
	createPublisherMutation,
	createPublishersQuery,
	createPublishHappMutation
} from './happs';

export function createAppQueries() {
	const queryClient = useQueryClient();
	const publishersQuery = createPublishersQuery();
	const appStoreMyHappsQuery = createAppStoreMyHappsQuery();
	const publisherMutation = createPublisherMutation(queryClient);
	const publishHappMutation = createPublishHappMutation(queryClient);

	return {
		publishersQuery,
		publisherMutation,
		publishHappMutation,
		appStoreMyHappsQuery
	};
}
