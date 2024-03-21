<script lang="ts">
	import { encodeHashToBase64 } from '@holochain/client';
	import { createQuery } from '@tanstack/svelte-query';

	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Button } from '$components';
	import { SYSTEM_SETTINGS } from '$const';
	import { getCellId, validateApp } from '$helpers';
	import { i18n, trpc } from '$services';

	const client = trpc();

	type Repo = {
		name: string;
		description: string;
		subscribers_count: number;
		stargazers_count: number;
		forks_count: number;
	};

	const query = createQuery<Repo>({
		queryKey: ['repoData'],
		queryFn: async () =>
			await fetch('https://api.github.com/repos/SvelteStack/svelte-query')
				.then((r) => r.json())
				.then((data) => {
					console.log(data);
					return data;
				}),
		refetchInterval: 10000
	});

	const holochainVersion = client.holochainVersion.createQuery();
	const installedApps = client.getInstalledApps.createQuery();
	const uninstallApp = client.uninstallApp.createMutation();

	$: view = $page.url.searchParams.get('view');
	$: selectedApp = $installedApps.data?.find((app) => app.appInfo.installed_app_id === view);
</script>

{#if view === SYSTEM_SETTINGS}
	<div>
		<h2 class="text-lg font-bold">{$i18n.t(SYSTEM_SETTINGS)}</h2>
		<h1>Simple</h1>
		<div class="my-4">
			<div>
				{#if $query.isPending}
					Loading...
				{/if}
				{#if $query.error}
					An error has occurred:
					{$query.error.message}
				{/if}
				{#if $query.isSuccess}
					<div>
						<h1>{$query.data.name}</h1>
						<p>{$query.data.description}</p>
						<strong>👀 {$query.data.subscribers_count}</strong>{' '}
						<strong>✨ {$query.data.stargazers_count}</strong>{' '}
						<strong>🍴 {$query.data.forks_count}</strong>
					</div>
				{/if}
			</div>
		</div>
	</div>
{:else if selectedApp}
	<div>
		<div class="flex items-center justify-between">
			<h2 class="text-lg font-bold">{selectedApp.appInfo.installed_app_id}</h2>
			<Button
				props={{
					onClick: () =>
						validateApp(selectedApp) &&
						$uninstallApp.mutate(selectedApp, {
							onSuccess: () => {
								$installedApps.refetch();
								goto('/settings');
							}
						}),
					class: 'btn-app-store variant-filled'
				}}
			>
				{$i18n.t('uninstall')}
			</Button>
		</div>
		{#each Object.entries(selectedApp.appInfo.cell_info) as [roleName, cellId]}
			{@const cellIdResult = getCellId(cellId[0])}
			{#if cellIdResult}
				<p class="break-all">
					{roleName}: {encodeHashToBase64(cellIdResult[0])}
				</p>
			{/if}
		{/each}
	</div>
{:else}
	<div>
		<h2 class="text-lg font-bold">{$i18n.t('holochainVersion')}</h2>
		{#if $holochainVersion.data}
			<p>
				{$holochainVersion.data.type}{#if 'version' in $holochainVersion.data}: {$holochainVersion
						.data.version}{/if}
			</p>
		{/if}
	</div>
{/if}
