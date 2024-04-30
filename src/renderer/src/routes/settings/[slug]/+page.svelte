<script lang="ts">
	import { encodeHashToBase64 } from '@holochain/client';
	import { getModalStore } from '@skeletonlabs/skeleton';

	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { AppDetailsPanel, Button } from '$components';
	import { MODAL_DEVHUB_INSTALLATION_CONFIRMATION } from '$const';
	import { createModalParams, getCellId, validateApp } from '$helpers';
	import { Download } from '$icons';
	import { i18n, trpc } from '$services';
	import { SETTINGS_SCREEN } from '$shared/const';

	const client = trpc();

	const modalStore = getModalStore();

	const installedApps = client.getInstalledApps.createQuery();
	const uninstallApp = client.uninstallApp.createMutation();
	const isDevhubInstalled = client.isDevhubInstalled.createQuery();

	const modal = createModalParams(MODAL_DEVHUB_INSTALLATION_CONFIRMATION);

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
	<div class="absolute p-8">
		<h3 class="h3 relative left-4 top-3">{$i18n.t('developerTools')}</h3>
		<div class="flex items-center rounded-lg border-2 border-dashed border-white/15 p-4 shadow-md">
			{#if $isDevhubInstalled.data}
				<p>{$i18n.t('devhubAlreadyInstalled')}</p>
			{:else}
				<Button
					props={{
						onClick: () => modalStore.trigger(modal),
						class: 'btn-install'
					}}
				>
					<div class="mr-2"><Download /></div>
					{$i18n.t('install')}
				</Button>
				<div class="text-sm">
					<span class="font-normal">{$i18n.t('developerToolsAllow')}</span>
					<span class="font-semibold">{$i18n.t('uploadAndPublish')}</span>
				</div>
			{/if}
		</div>
	</div>
{/if}
