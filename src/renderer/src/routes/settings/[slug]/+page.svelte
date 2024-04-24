<script lang="ts">
	import { encodeHashToBase64 } from '@holochain/client';

	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { AppDetailsPanel, Button } from '$components';
	import { SYSTEM_SETTINGS } from '$const';
	import { getCellId, validateApp } from '$helpers';
	import { i18n, trpc } from '$services';
	import { SETTINGS_SCREEN } from '$shared/const';

	const client = trpc();

	const installedApps = client.getInstalledApps.createQuery();
	const uninstallApp = client.uninstallApp.createMutation();

	$: view = $page.params.slug;
	$: selectedApp = $installedApps.data?.find((app) => app.appInfo.installed_app_id === view);
</script>

{#if selectedApp}
	<AppDetailsPanel title={selectedApp.appInfo.installed_app_id} buttons={[$i18n.t('details')]} />
	<div class="p-8">
		<div class="flex items-center justify-between">
			<Button
				props={{
					onClick: () =>
						validateApp(selectedApp) &&
						$uninstallApp.mutate(selectedApp, {
							onSuccess: () => {
								$installedApps.refetch();
								goto(`/${SETTINGS_SCREEN}`);
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
	<div class="p-8">
		<h2 class="text-lg font-bold">{$i18n.t(SYSTEM_SETTINGS)}</h2>
	</div>
{/if}
