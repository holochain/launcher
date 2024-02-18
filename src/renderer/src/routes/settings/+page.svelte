<script lang="ts">
	import { encodeHashToBase64 } from '@holochain/client';
	import { onMount } from 'svelte';

	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { getCellId, validateApp } from '$helpers';
	import { i18n, trpc } from '$services';

	import { MenuEntry, TopBar } from './components';

	const client = trpc();

	const installedApps = client.getInstalledApps.createQuery();

	onMount(() => {
		const unsubscribe = installedApps.subscribe(({ data }) => {
			if (data && data.length > 0) {
				selectApp(data[0].appInfo.installed_app_id);
				unsubscribe();
			}
		});
	});

	function selectApp(appId: string) {
		const url = new URL(window.location.toString());
		url.searchParams.set('appId', appId);
		goto(url.toString());
	}

	$: appId = $page.url.searchParams.get('appId');
</script>

<TopBar />
<div class="chat grid h-full w-full grid-cols-[40%_1fr]">
	<div class="grid grid-rows-[auto_1fr_auto] border-r border-surface-500/30">
		<div class="space-y-4 overflow-y-auto p-4">
			<div class="flex flex-col space-y-1">
				{#if $installedApps.isLoading}
					<p>{$i18n.t('loading')}</p>
				{:else if $installedApps.isSuccess}
					{#each $installedApps.data.filter(validateApp) as app (app.appInfo.installed_app_id)}
						<MenuEntry
							isApp
							name={app.appInfo.installed_app_id}
							onClick={() => selectApp(app.appInfo.installed_app_id)}
						/>
					{/each}
				{/if}
			</div>
		</div>
	</div>
	<div class="grid-row-[1fr_auto] grid p-4">
		{#if appId && $installedApps.data}
			{#each $installedApps.data.filter((app) => app.appInfo.installed_app_id === appId) as app}
				<div>
					<h2 class="text-lg font-bold">{app.appInfo.installed_app_id}</h2>
					{#each Object.entries(app.appInfo.cell_info) as [roleName, cellId]}
						{@const cellIdResult = getCellId(cellId[0])}
						{#if cellIdResult}
							<p class="break-all">
								{roleName}: {encodeHashToBase64(cellIdResult[0])}
							</p>
						{/if}
					{/each}
				</div>
			{/each}
		{:else}
			<p>Select an app to view details</p>
		{/if}
	</div>
</div>
