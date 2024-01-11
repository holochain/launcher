<script lang="ts">
	import { ProgressRadial } from '@skeletonlabs/skeleton';

	import { Error, InstallAppForm } from '$components';
	import AppEntry from '$components/AppEntry.svelte';
	import { validateApp } from '$helpers';
	import { i18n, trpc } from '$services';

	const client = trpc();

	const installedApps = client.getInstalledApps.createQuery();
</script>

<InstallAppForm />

<div class="col center-content mx-auto max-w-xs space-y-2 text-center">
	{#if $installedApps.isLoading}
		<ProgressRadial />
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
