import { useQueryClient } from '@tanstack/svelte-query';

import { createPublisherMutation, createPublishersQuery, createPublishHappMutation } from './happs';

export function createAppQueries() {
	const queryClient = useQueryClient();
	const publishersQuery = createPublishersQuery();
	const publisherMutation = createPublisherMutation(queryClient);
	const publishHappMutation = createPublishHappMutation();

	return {
		publishersQuery,
		publisherMutation,
		publishHappMutation
	};
}
