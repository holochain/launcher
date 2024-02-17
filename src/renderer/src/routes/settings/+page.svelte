<script lang="ts">
	import { onMount } from 'svelte';

	import { Button } from '$components';
	import { validateApp } from '$helpers';
	import { Gear, Home, Rocket } from '$icons';
	import { trpc } from '$services';

	import { AppStore, AppsView } from '../../../../types';

	const client = trpc();

	const installedApps = client.getInstalledApps.createQuery();

	let selectedAppId: string;

	onMount(() => {
		const unsubscribe = installedApps.subscribe(({ data }) => {
			if (data && data.length > 0) {
				selectedAppId = data[0].appInfo.installed_app_id;
				unsubscribe();
			}
		});
	});

	const closeSettings = client.closeSettings.createMutation();
</script>

<div class="app-region-drag flex justify-between p-3 dark:bg-apps-input-dark-gradient">
	<Button
		props={{
			class: 'p-2 app-region-no-drag',
			onClick: () => $closeSettings.mutate(AppStore)
		}}
	>
		<Home />
	</Button>
	<Button
		props={{
			class: 'p-2 mr-2 app-region-no-drag',
			onClick: () => $closeSettings.mutate(AppsView)
		}}
	>
		<Rocket />
	</Button>
	<Button
		props={{
			class: 'ml-auto app-region-no-drag p-2 bg-black rounded-md'
		}}
	>
		<Gear />
	</Button>
</div>

<!-- <div class="center-content mx-auto max-w-xs space-y-2 text-center">
	{#if $installedApps.isLoading}
		<CenterProgressRadial />
	{:else if $installedApps.error}
		<Error text={$installedApps.error.message} />
	{:else if $installedApps.isSuccess}
		{#each $installedApps.data.filter(validateApp) as app}
			<AppEntry {app} />
		{/each}
		{#if $installedApps.data.length === 0}
			<p>{$i18n.t('noAppsInstalled')}</p>
		{/if}
	{/if}
</div> -->

<div class="chat grid h-full w-full grid-cols-[40%_1fr]">
	<div class="grid grid-rows-[auto_1fr_auto] border-r border-surface-500/30">
		<div class="space-y-4 overflow-y-auto p-4">
			<div class="flex flex-col space-y-1">
				{#if $installedApps.isLoading}
					<p>Loading...</p>
				{:else if $installedApps.error}
					<p>Error: {$installedApps.error.message}</p>
				{:else if $installedApps.isSuccess}
					{#each $installedApps.data.filter(validateApp) as app (app.appInfo.installed_app_id)}
						<button
							type="button"
							class="card cursor-pointer bg-surface-200 p-2"
							on:click={() => (selectedAppId = app.appInfo.installed_app_id)}
							aria-label={`Select ${app.appInfo.installed_app_id}`}
						>
							{app.appInfo.installed_app_id}
						</button>
					{/each}
				{/if}
			</div>
		</div>
	</div>
	<div class="grid-row-[1fr_auto] grid p-4">
		{#if selectedAppId && $installedApps.data}
			{#each $installedApps.data.filter((app) => app.appInfo.installed_app_id === selectedAppId) as app}
				<div>
					<h2 class="text-lg font-bold">{app.appInfo.installed_app_id}</h2>
					{#each Object.entries(app.appInfo.cell_info) as [roleName, cellId]}
						<p>{roleName}: {cellId}</p>
					{/each}
				</div>
			{/each}
		{:else}
			<p>Select an app to view details</p>
		{/if}
	</div>
</div>
