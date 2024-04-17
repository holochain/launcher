<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { ADD_APP_PAGE, DEV_PAGE, VIEW } from '$const';
	import { getRawQueryParam, uint8ArrayToURIComponent } from '$helpers';
	import { Plus } from '$icons';
	import { createAppQueries } from '$queries';
	import { i18n } from '$services';

	import MenuEntry from './MenuEntry.svelte';

	const { appStoreMyHappsQuery } = createAppQueries();

	const selectView = (view: string) => goto(`/${DEV_PAGE}${view ? `?${VIEW}=${view}` : ''}`);

	$: view = getRawQueryParam($page.url.href, VIEW);
</script>

<MenuEntry
	background={view ? 'bg-white/10' : 'bg-app-button-gradient'}
	name={$i18n.t('addhApp')}
	onClick={() => goto(`/${DEV_PAGE}/${ADD_APP_PAGE}`)}
	isSelected
>
	<div slot="leading" class="pr-2">
		<Plus />
	</div>
</MenuEntry>
<div class="!my-2 h-px w-full bg-tertiary-800"></div>
<span class="text-[10px] font-light opacity-50">{$i18n.t('yourHapps').toUpperCase()}</span>
{#if $appStoreMyHappsQuery.isError}
	<p>{$appStoreMyHappsQuery.error}</p>
{:else if $appStoreMyHappsQuery.isSuccess}
	{#each $appStoreMyHappsQuery.data as app (app.id)}
		{@const appIdString = uint8ArrayToURIComponent(app.id)}
		<MenuEntry
			isApp
			icon={app.icon}
			isSelected={view === appIdString}
			name={app.title}
			onClick={() => selectView(appIdString)}
		/>
	{/each}
{/if}
