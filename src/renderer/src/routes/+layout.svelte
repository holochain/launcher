<script lang="ts">
	import '../app.postcss';

	import { initializeStores, Modal } from '@skeletonlabs/skeleton';
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';

	const queryClient = new QueryClient();

	initializeStores();
</script>

<QueryClientProvider client={queryClient}>
	<Modal />
	<div class="flex h-full min-w-80 flex-col">
		<slot />
	</div>
</QueryClientProvider>
