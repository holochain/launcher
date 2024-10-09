<script lang="ts">
	import { page } from '$app/stores';
	import { AppDetailsPanel } from '$components';
	import { createImageUrl, uint8ArrayToURIComponent } from '$helpers';
	import { createAppQueries } from '$queries';
	import { i18n } from '$services';

	import Appearance from './components/Appearance.svelte';
	import Releases from './components/Releases.svelte';
	import Settings from './components/Settings.svelte';

	let selectedIndex = 0;

	const { appVersionsAppstoreQueryFunction, appStoreMyAppsQuery } = createAppQueries();

	$: view = $page.params.slug;
	$: if (view) {
		selectedIndex = 0;
	}

	$: app = $appStoreMyAppsQuery?.data?.find((app) => uint8ArrayToURIComponent(app.id) === view);

	$: appVersionsQuery = appVersionsAppstoreQueryFunction(app?.id);
</script>

{#if $appStoreMyAppsQuery.isSuccess}
	{@const app = $appStoreMyAppsQuery.data.find((app) => uint8ArrayToURIComponent(app.id) === view)}
	{#if app}
		{@const imageUrl = createImageUrl(app.content.icon)}

		<AppDetailsPanel
			id={app.id}
			{imageUrl}
			title={app.content.title}
			buttons={[$i18n.t('releases'), $i18n.t('appearance'), $i18n.t('settings')]}
			publisher={undefined}
			bind:selectedIndex
			deprecated={!!app.content.deprecation}
		/>
	{/if}
{/if}
<div>
	{#if $appVersionsQuery?.isSuccess && app}
		{#if selectedIndex === 0}
			<Releases {app} appVersions={$appVersionsQuery.data} />
		{:else if selectedIndex === 1}
			<Appearance {app} />
		{:else if selectedIndex === 2}
			<Settings {app} />
		{/if}
	{/if}
</div>
