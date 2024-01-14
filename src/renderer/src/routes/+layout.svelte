<script lang="ts">
	import '../app.postcss';

	import { initializeStores, Modal } from '@skeletonlabs/skeleton';
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';

	const queryClient = new QueryClient();

	initializeStores();
</script>

<Modal />
<QueryClientProvider client={queryClient}>
	<slot />
</QueryClientProvider>
