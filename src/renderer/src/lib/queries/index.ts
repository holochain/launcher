import { useQueryClient } from '@tanstack/svelte-query';

import {
	createAppStoreHappsQuery,
	createPublisherMutation,
	createPublishersQuery,
	createPublishHappMutation
} from './happs';

export function createAppQueries() {
	const queryClient = useQueryClient();
	const publishersQuery = createPublishersQuery();
	const appStoreHappsQuery = createAppStoreHappsQuery();
	const publisherMutation = createPublisherMutation(queryClient);
	const publishHappMutation = createPublishHappMutation(queryClient);

	return {
		publishersQuery,
		publisherMutation,
		publishHappMutation,
		appStoreHappsQuery
	};
}
