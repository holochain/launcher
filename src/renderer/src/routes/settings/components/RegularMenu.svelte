<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { SYSTEM_INFORMATION, SYSTEM_SETTINGS } from '$const';
	import { validateApp } from '$helpers';
	import { i18n, trpc } from '$services';
	import { SETTINGS_SCREEN } from '$shared/const';

	import MenuEntry from './MenuEntry.svelte';

	const client = trpc();

	const installedApps = client.getInstalledApps.createQuery();

	const selectView = (view: string) => goto(`/${SETTINGS_SCREEN}${view ? `?view=${view}` : ''}`);

	$: view = $page.url.searchParams.get('view');

	const systemViews = [SYSTEM_INFORMATION, SYSTEM_SETTINGS];
</script>

{#each systemViews as systemView}
	<MenuEntry
		name={$i18n.t(systemView)}
		onClick={() => selectView(systemView)}
		isSelected={view === systemView || (!view && systemView === SYSTEM_INFORMATION)}
	/>
{/each}
<div class="!my-2 h-px w-full bg-tertiary-800"></div>
{#if $installedApps.isLoading}
	<p>{$i18n.t('loading')}</p>
{:else if $installedApps.isSuccess}
	{#each $installedApps.data.filter(validateApp) as app (app.appInfo.installed_app_id)}
		<MenuEntry
			isApp
			name={app.appInfo.installed_app_id}
			onClick={() => selectView(app.appInfo.installed_app_id)}
			isSelected={view === app.appInfo.installed_app_id}
		/>
	{/each}
{/if}
