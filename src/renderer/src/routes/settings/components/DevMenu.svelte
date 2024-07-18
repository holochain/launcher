<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';

	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { CenterProgressRadial } from '$components';
	import { DEV_APP_PAGE, DEV_PAGE } from '$const';
	import { showModalError, uint8ArrayToURIComponent } from '$helpers';
	import { Plus } from '$icons';
	import { createAppQueries } from '$queries';
	import { i18n } from '$services';

	import MenuEntry from './MenuEntry.svelte';
	const { appStoreMyHappsQuery } = createAppQueries();
	const modalStore = getModalStore();

	const selectView = (view: string) => goto(`/${DEV_APP_PAGE}/${view}`);

	const showErrorModal = (error: string) => {
		showModalError({
			modalStore,
			errorTitle: $i18n.t('appError'),
			errorMessage: $i18n.t(error)
		});
	};

	$: view = $page.params.slug;

	onMount(() =>
		appStoreMyHappsQuery.subscribe((value) => {
			if (value.isError) {
				showErrorModal(value.error.message);
			}
		})
	);
</script>

<MenuEntry
	background={view ? 'transparent' : 'bg-white/30'}
	name={$i18n.t('addhApp')}
	onClick={() => goto(`/${DEV_PAGE}`)}
	isSelected
>
	<div slot="leading" class="pr-2">
		<Plus />
	</div>
</MenuEntry>
<div class="!my-2 h-px w-full bg-tertiary-800"></div>
<span class="text-[10px] font-light opacity-50">{$i18n.t('yourHapps').toUpperCase()}</span>
{#if $appStoreMyHappsQuery.isPending}
	<CenterProgressRadial width="w-12" />
{:else if $appStoreMyHappsQuery.isSuccess}
	{#each $appStoreMyHappsQuery.data as app (app.id)}
		{@const appIdString = uint8ArrayToURIComponent(app.id)}
		<MenuEntry
			icon={app.icon}
			isSelected={view === appIdString}
			name={app.title}
			onClick={() => selectView(appIdString)}
		/>
	{/each}
{/if}
