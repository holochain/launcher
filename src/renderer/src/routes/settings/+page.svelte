<script lang="ts">
	import { encodeHashToBase64 } from '@holochain/client';

	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Button } from '$components';
	import { getCellId, validateApp } from '$helpers';
	import { i18n, trpc } from '$services';

	const client = trpc();

	const holochainVersion = client.holochainVersion.createQuery();
	const installedApps = client.getInstalledApps.createQuery();
	const uninstallApp = client.uninstallApp.createMutation();

	$: view = $page.url.searchParams.get('view');
	$: selectedApp = $installedApps.data?.find((app) => app.appInfo.installed_app_id === view);
</script>

{#if !view}
	<div>
		<h2 class="text-lg font-bold">{$i18n.t('holochainVersion')}</h2>
		{#if $holochainVersion.data}
			<p>
				{$holochainVersion.data.type}{#if 'version' in $holochainVersion.data}: {$holochainVersion
						.data.version}{/if}
			</p>
		{/if}
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
{/if}
