<script lang="ts">
	import { onMount } from 'svelte';

	import { page } from '$app/stores';
	import { DEV_PAGE } from '$const';
	import { initializeAppPortSubscription } from '$helpers';
	import { trpc } from '$services';

	import { DevMenu, RegularMenu, TopBar } from './components';
	import { APP_STORE_APP_ID, DEVHUB_APP_ID } from '$shared/const';

	const client = trpc();

	const utils = client.createUtils();

	$: isDevPage = $page.url.pathname.includes(DEV_PAGE);

	onMount(async () => {
		const [isDevhubInstalled, appPort, appstoreToken] = await Promise.all([
			utils.isDevhubInstalled.fetch(),
			utils.getAppPort.fetch(),
			utils.getAppAuthenticationToken.fetch(APP_STORE_APP_ID)
		]);

		let devhubToken;
		if (isDevhubInstalled) {
			devhubToken = await utils.getAppAuthenticationToken.fetch(DEVHUB_APP_ID);
		}

		initializeAppPortSubscription(appPort, appstoreToken, devhubToken);
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
