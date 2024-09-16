<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';

	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { CenterProgressRadial } from '$components';
	import { DEV_APP_PAGE, DEV_PAGE } from '$const';
	import { showModalError, uint8ArrayToURIComponent } from '$helpers';
	import { Plus } from '$icons';
	import Gear from '$icons/Gear.svelte';
	import { createAppQueries } from '$queries';
	import { i18n } from '$services';

	import MenuEntry from './MenuEntry.svelte';
	const { appStoreMyAppsQuery, publishersQuery } = createAppQueries();
	const modalStore = getModalStore();

	const selectView = (view: string) => goto(`/${DEV_APP_PAGE}/${view}`);

	const showErrorModal = (error: string) => {
		showModalError({
			modalStore,
			errorTitle: $i18n.t('appError'),
			errorMessage: $i18n.t(error)
		});
	};

	$: view = $page.url.pathname;

	onMount(() =>
		appStoreMyAppsQuery.subscribe((value) => {
			if (value.isError) {
				showErrorModal(value.error.message);
			}
		})
	);
</script>

<MenuEntry
	name={$i18n.t('publisherSettings')}
	onClick={() => goto(`/${DEV_PAGE}/publisher`)}
	isSelected={view === `/${DEV_PAGE}/publisher`}
>
	<div slot="leading" class="pr-2">
		<Gear fillColor="white" />
	</div>
</MenuEntry>
<MenuEntry
	name={$i18n.t('publishNewApp')}
	onClick={() => goto(`/${DEV_PAGE}`)}
	isSelected={view === `/${DEV_PAGE}`}
	disabled={!$publishersQuery.data || $publishersQuery.data.length < 1}
>
	<div slot="leading" class="pr-2">
		<Plus />
	</div>
</MenuEntry>
<div class="!my-2 h-px w-full bg-tertiary-800"></div>

{#if $appStoreMyAppsQuery.isPending}
	<CenterProgressRadial width="w-12" />
{:else if $appStoreMyAppsQuery.isSuccess}
	{@const yourApps = $appStoreMyAppsQuery.data
		.filter((entity) => !entity.content.deprecation)
		.sort((entityA, entityB) => entityA.content.title.localeCompare(entityB.content.title))}
	{#if yourApps.length > 0}
		<span class="text-xs font-light font-semibold opacity-50"
			>{$i18n.t('yourHapps').toUpperCase()}</span
		>
		{#each yourApps as app (app.id)}
			{@const appIdString = uint8ArrayToURIComponent(app.id)}
			<MenuEntry
				icon={app.content.icon}
				isSelected={view.split('/')[view.split('/').length - 1] === appIdString}
				name={app.content.title}
				onClick={() => selectView(appIdString)}
			/>
		{/each}
	{/if}

	{@const deprecatedApps = $appStoreMyAppsQuery.data
		.filter((entity) => entity.content.deprecation)
		.sort((entityA, entityB) => entityA.content.title.localeCompare(entityB.content.title))}

	{#if deprecatedApps.length > 0}
		<span class="text-xs font-light font-semibold opacity-50" style="margin-top: 10px;"
			>{$i18n.t('Deprecated apps').toUpperCase()}</span
		>
		{#each deprecatedApps as app (app.id)}
			{@const appIdString = uint8ArrayToURIComponent(app.id)}
			<MenuEntry
				icon={app.content.icon}
				isSelected={view.split('/')[view.split('/').length - 1] === appIdString}
				name={app.content.title}
				onClick={() => selectView(appIdString)}
			/>
		{/each}
	{/if}
{/if}
