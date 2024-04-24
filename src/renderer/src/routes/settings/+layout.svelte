<script lang="ts">
	import { onMount } from 'svelte';

	import { page } from '$app/stores';
	import { DEV_PAGE } from '$const';
	import { initializeAppPortSubscription } from '$helpers';
	import { trpc } from '$services';

	import { DevMenu, RegularMenu, TopBar } from './components';

	const client = trpc();

	const appPort = client.getAppPort.createQuery();

	$: isDevPage = $page.url.pathname.includes(DEV_PAGE);

	onMount(() => {
		initializeAppPortSubscription(appPort);
	});
</script>

<TopBar />
<div
	class="grid h-full w-full grid-cols-[35%_1fr] bg-light-background bg-fixed dark:bg-app-dark-gradient"
>
	<div
		class="grid grid-rows-[auto_1fr_auto] bg-light-background bg-fixed shadow-3xl dark:bg-app-dark-gradient"
	>
		<div class="space-y-4 overflow-y-auto p-4">
			<div class="flex flex-col space-y-1">
				{#if isDevPage}
					<DevMenu />
				{:else}
					<RegularMenu />
				{/if}
			</div>
		</div>
	</div>
	<div class="grid-row-[1fr_auto]">
		<slot />
	</div>
</div>
