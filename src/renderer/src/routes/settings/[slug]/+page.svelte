<script lang="ts">
	import { encodeHashToBase64 } from '@holochain/client';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import clsx from 'clsx';

	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { AppDetailsPanel, Button } from '$components';
	import { MODAL_DEVHUB_INSTALLATION_CONFIRMATION } from '$const';
	import {
		createModalParams,
		filterHash,
		getAppStoreDistributionHash,
		getCellId,
		validateApp
	} from '$helpers';
	import { Download } from '$icons';
	import { createAppQueries } from '$queries';
	import { i18n, trpc } from '$services';
	import { SETTINGS_SCREEN } from '$shared/const';

	import { DashedSection } from '../components';

	const client = trpc();

	const modalStore = getModalStore();

	const { checkForAppUiUpdatesQuery } = createAppQueries();

	const installedApps = client.getInstalledApps.createQuery();
	const uninstallApp = client.uninstallApp.createMutation();
	const isDevhubInstalled = client.isDevhubInstalled.createQuery();

	$: uiUpdates = checkForAppUiUpdatesQuery(
		$installedApps?.data
			?.map((app) => getAppStoreDistributionHash(app.distributionInfo))
			.filter(filterHash) ?? []
	);

	const modal = createModalParams(MODAL_DEVHUB_INSTALLATION_CONFIRMATION);

	$: view = $page.params.slug;
	$: selectedApp = $installedApps.data?.find((app) => app.appInfo.installed_app_id === view);
</script>

{#if selectedApp}
	<AppDetailsPanel
		distributionInfo={selectedApp.distributionInfo}
		title={selectedApp.appInfo.installed_app_id}
		buttons={[$i18n.t('details')]}
	/>
	{@const isUpdateAvailable = $uiUpdates.data?.[selectedApp.appInfo.installed_app_id]}
	{#if isUpdateAvailable}
		<DashedSection borderColor="border-warning-500/30">
			<div class="flex w-full justify-between">
				<h2 class="h2 text-warning-500">{$i18n.t('updateAvailable')}</h2>
				<Button
					props={{
						onClick: () => {},
						class: 'btn bg-warning-500'
					}}
				>
					<div class="mr-2"><Download /></div>
					{$i18n.t('install')}
				</Button>
			</div>
		</DashedSection>
	{/if}
	<div class={clsx('p-8', isUpdateAvailable && 'pt-0')}>
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
	<DashedSection title={$i18n.t('developerTools')}>
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
	</DashedSection>
{/if}
