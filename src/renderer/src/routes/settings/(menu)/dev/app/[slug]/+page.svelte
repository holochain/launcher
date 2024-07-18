<script lang="ts">
	import { page } from '$app/stores';
	import { AppDetailsPanel } from '$components';
	import { createImageUrl, uint8ArrayToURIComponent } from '$helpers';
	import { createAppQueries } from '$queries';
	import { i18n } from '$services';

	import Releases from './components/Releases.svelte';
	import Settings from './components/Settings.svelte';

	let selectedIndex = 0;

	const { appVersionsAppstoreQueryFunction, appStoreMyHappsQuery } = createAppQueries();

	$: view = $page.params.slug;
	$: if (view) {
		selectedIndex = 0;
	}

	$: app = $appStoreMyHappsQuery?.data?.find((app) => uint8ArrayToURIComponent(app.id) === view);

	$: appVersionsQuery = appVersionsAppstoreQueryFunction(app?.id);
</script>

{#if $appStoreMyHappsQuery.isSuccess}
	{@const app = $appStoreMyHappsQuery.data.find((app) => uint8ArrayToURIComponent(app.id) === view)}
	{#if app}
		{@const imageUrl = createImageUrl(app.icon)}

		<AppDetailsPanel
			id={app.id}
			{imageUrl}
			title={app.title}
			buttons={[$i18n.t('releases'), $i18n.t('settings')]}
			bind:selectedIndex
		/>
	{/if}
{/if}
<div class="px-8 py-6">
	{#if $appVersionsQuery?.isSuccess && app}
		{#if selectedIndex === 0}
			<Releases {app} appVersions={$appVersionsQuery.data} />
		{:else if selectedIndex === 1}
			<Settings {app} />
		{/if}
	{/if}
</div>
