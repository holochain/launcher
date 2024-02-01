<script lang="ts">
	import { CenterProgressRadial, Error } from '$components';
	import { validateApp } from '$helpers';
	import { i18n, trpc } from '$services';

	import { AppEntry, InstallAppForm } from './components';

	const client = trpc();

	const installedApps = client.getInstalledApps.createQuery();
</script>

<InstallAppForm />

<div class="center-content mx-auto max-w-xs space-y-2 text-center">
	{#if $installedApps.isLoading}
		<CenterProgressRadial />
	{:else if $installedApps.error}
		<Error text={$installedApps.error.message} />
	{:else if $installedApps.isSuccess}
		{#each $installedApps.data.filter(validateApp) as app}
			<AppEntry {app} />
		{/each}
		{#if $installedApps.data.length === 0}
			<p>{$i18n.t('noAppsInstalled')}</p>
		{/if}
	{/if}
</div>
