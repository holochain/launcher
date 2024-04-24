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

	const selectView = (view: string) => goto(`/${SETTINGS_SCREEN}/${view}`);

	$: view = $page.params.slug;
</script>

<MenuEntry name={$i18n.t(SYSTEM_INFORMATION)} onClick={() => selectView('')} isSelected={!view} />
<MenuEntry
	name={$i18n.t(SYSTEM_SETTINGS)}
	onClick={() => selectView(SYSTEM_SETTINGS)}
	isSelected={view === SYSTEM_SETTINGS}
/>
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
