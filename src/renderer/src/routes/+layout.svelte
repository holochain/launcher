<script lang="ts">
	import '../app.postcss';

	import { AppBar, AppShell } from '@skeletonlabs/skeleton';
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';

	import { i18n } from '$services';

	const queryClient = new QueryClient();
</script>

<QueryClientProvider client={queryClient}>
	<AppShell>
		<svelte:fragment slot="header">
			<!-- App Bar -->
			<AppBar>
				<svelte:fragment slot="lead">
					<strong class="text-xl uppercase">{$i18n.t('launcher')}</strong>
				</svelte:fragment>
			</AppBar>
		</svelte:fragment>
		<!-- Page Route Content -->
		<slot />
	</AppShell>
</QueryClientProvider>
