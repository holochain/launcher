<script lang="ts">
	import { goto } from '$app/navigation';
	import { ADD_APP_PAGE } from '$const';
	import { Plus } from '$icons';
	import { createAppQueries } from '$queries';
	import { i18n } from '$services';

	import MenuEntry from './MenuEntry.svelte';

	const { appStoreMyHappsQuery } = createAppQueries();
</script>

<MenuEntry
	background="bg-app-button-gradient"
	name={$i18n.t('addhApp')}
	onClick={() => goto(`${ADD_APP_PAGE}`)}
	isSelected
>
	<div slot="leading" class="pr-2">
		<Plus />
	</div>
</MenuEntry>

{#if $appStoreMyHappsQuery.isSuccess}
	{#each $appStoreMyHappsQuery.data as app (app.id)}
		<MenuEntry isApp name={app.content.title} onClick={() => {}} isSelected={false} />
	{/each}
{/if}
