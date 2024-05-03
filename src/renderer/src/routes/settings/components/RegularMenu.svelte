<script lang="ts">
	import { ProgressRadial } from '@skeletonlabs/skeleton';
	import clsx from 'clsx';

	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { SYSTEM_INFORMATION, SYSTEM_SETTINGS } from '$const';
	import { filterHash, getAppStoreDistributionHash, validateApp } from '$helpers';
	import { MenuGear, MenuInfo } from '$icons';
	import { createAppQueries } from '$queries';
	import { i18n, trpc } from '$services';
	import { SETTINGS_SCREEN } from '$shared/const';

	import MenuEntry from './MenuEntry.svelte';

	const client = trpc();

	const installedApps = client.getInstalledApps.createQuery();

	const { checkForAppUiUpdatesQuery } = createAppQueries();

	$: uiUpdates = checkForAppUiUpdatesQuery(
		$installedApps?.data
			?.map((app) => getAppStoreDistributionHash(app.distributionInfo))
			.filter(filterHash) ?? []
	);

	const selectView = (view: string) => goto(`/${SETTINGS_SCREEN}/${view}`);

	$: view = $page.params.slug;
</script>

{#each [{ name: SYSTEM_INFORMATION, icon: MenuInfo }, { name: SYSTEM_SETTINGS, icon: MenuGear }] as { name, icon }}
	{@const isSelected = (name === SYSTEM_INFORMATION && !view) || view === name}
	<MenuEntry
		name={$i18n.t(name)}
		onClick={() => selectView(name === SYSTEM_INFORMATION ? '' : name)}
		{isSelected}
	>
		<div slot="leading" class={clsx('mr-4', !isSelected && 'opacity-80')}>
			<svelte:component this={icon} />
		</div>
	</MenuEntry>
{/each}
<div class="!my-2 h-px w-full bg-tertiary-800"></div>
{#if $installedApps.isPending}
	<ProgressRadial stroke={100} width="w-6" />
{:else if $installedApps.isSuccess}
	{#each $installedApps.data.filter(validateApp) as app (app.appInfo.installed_app_id)}
		<MenuEntry
			isUpdateAvailable={!!$uiUpdates.data?.[app.appInfo.installed_app_id]}
			name={app.appInfo.installed_app_id}
			onClick={() => selectView(app.appInfo.installed_app_id)}
			isSelected={view === app.appInfo.installed_app_id}
		/>
	{/each}
{/if}
