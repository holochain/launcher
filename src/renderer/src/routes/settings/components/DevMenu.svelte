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
	background={view === `/${DEV_PAGE}/publisher` ? 'bg-white/30' : 'transparent'}
	name={$i18n.t('publisherSettings')}
	onClick={() => goto(`/${DEV_PAGE}/publisher`)}
	isSelected={view === `/${DEV_PAGE}/publisher`}
>
	<div slot="leading" class="pr-2">
		<Gear fillColor="white" />
	</div>
</MenuEntry>
<MenuEntry
	background={view === `/${DEV_PAGE}` ? 'bg-white/30' : 'transparent'}
	name={$i18n.t('publishNewApp')}
	onClick={() => goto(`/${DEV_PAGE}`)}
	isSelected={view === `/${DEV_PAGE}`}
	disabled={!$publishersQuery.data}
>
	<div slot="leading" class="pr-2">
		<Plus />
	</div>
</MenuEntry>
<div class="!my-2 h-px w-full bg-tertiary-800"></div>
<span class="text-[10px] font-light opacity-50">{$i18n.t('yourHapps').toUpperCase()}</span>
{#if $appStoreMyAppsQuery.isPending}
	<CenterProgressRadial width="w-12" />
{:else if $appStoreMyAppsQuery.isSuccess}
	{#each $appStoreMyAppsQuery.data as app (app.id)}
		{@const appIdString = uint8ArrayToURIComponent(app.id)}
		<MenuEntry
			icon={app.content.icon}
			isSelected={view.split('/')[view.split('/').length - 1] === appIdString}
			name={app.content.title}
			onClick={() => selectView(appIdString)}
		/>
	{/each}
{/if}
