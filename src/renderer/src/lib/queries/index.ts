import { useQueryClient } from '@tanstack/svelte-query';

import { createPublisherMutation, createPublishersQuery } from './publisher';

export function createAppQueries() {
	const queryClient = useQueryClient();
	const publishersQuery = createPublishersQuery();
	const publisherMutation = createPublisherMutation(queryClient);

	return {
		publishersQuery,
		publisherMutation
	};
}
