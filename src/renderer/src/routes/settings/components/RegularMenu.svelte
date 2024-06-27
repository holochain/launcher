<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';
	import clsx from 'clsx';
	import { onMount } from 'svelte';

	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { CenterProgressRadial } from '$components';
	import {
		NOT_SELECTED_ICON_STYLE,
		SELECTED_ICON_STYLE,
		SYSTEM_INFORMATION,
		SYSTEM_SETTINGS
	} from '$const';
	import {
		filterHash,
		getAppStoreDistributionHash,
		isDev,
		showModalError,
		validateApp
	} from '$helpers';
	import { Gear, MenuInfo } from '$icons';
	import { createAppQueries } from '$queries';
	import { i18n, trpc } from '$services';
	import { DISTRIBUTION_TYPE_APPSTORE, SETTINGS_SCREEN } from '$shared/const';

	import MenuEntry from './MenuEntry.svelte';

	const client = trpc();
	const modalStore = getModalStore();

	const installedApps = client.getInstalledApps.createQuery(true);

	const { checkForAppUiUpdatesQuery } = createAppQueries();

	const showErrorModal = (error: string) => {
		showModalError({
			modalStore,
			errorTitle: $i18n.t('appError'),
			errorMessage: $i18n.t(error)
		});
	};

	$: uiUpdates = checkForAppUiUpdatesQuery(
		$installedApps?.data
			?.map((app) => getAppStoreDistributionHash(app.distributionInfo))
			.filter(filterHash) ?? [],
		isDev()
	);

	onMount(() =>
		installedApps.subscribe((value) => {
			if (value.isError) {
				showErrorModal(value.error.message);
			}
		})
	);

	const selectView = (view: string) => goto(`/${SETTINGS_SCREEN}/${view}`);

	$: view = $page.params.slug;
</script>

<MenuEntry name={$i18n.t(SYSTEM_INFORMATION)} onClick={() => selectView('')} isSelected={!view}>
	<div slot="leading" class={clsx('ml-[1.5px] mr-[14px]')}>
		<MenuInfo fillColor={view ? NOT_SELECTED_ICON_STYLE : SELECTED_ICON_STYLE} />
	</div>
</MenuEntry>

<MenuEntry
	name={$i18n.t(SYSTEM_SETTINGS)}
	onClick={() => selectView(SYSTEM_SETTINGS)}
	isSelected={view === SYSTEM_SETTINGS}
>
	<div slot="leading" class={clsx('mr-3', view !== SYSTEM_SETTINGS)}>
		<Gear fillColor={view === SYSTEM_SETTINGS ? SELECTED_ICON_STYLE : NOT_SELECTED_ICON_STYLE} />
	</div>
</MenuEntry>
<div class="!my-2 h-px w-full bg-tertiary-800"></div>
{#if $installedApps.isPending}
	<CenterProgressRadial width="w-12" />
{:else if $installedApps.isSuccess}
	{#each $installedApps.data.filter(validateApp) as app (app.appInfo.installed_app_id)}
		{@const isUpdateAvailable =
			app.distributionInfo.type == DISTRIBUTION_TYPE_APPSTORE &&
			!!$uiUpdates.data?.[app.distributionInfo.appVersionActionHash]}
		<MenuEntry
			icon={app.icon}
			{isUpdateAvailable}
			name={app.appInfo.installed_app_id}
			onClick={() => selectView(app.appInfo.installed_app_id)}
			isSelected={view === app.appInfo.installed_app_id}
		/>
	{/each}
{/if}
