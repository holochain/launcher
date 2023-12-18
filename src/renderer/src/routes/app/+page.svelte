<script lang="ts">
	import { ProgressRadial } from '@skeletonlabs/skeleton';

	import { Error } from '$components';
	import { i18n, trpc } from '$services';

	const client = trpc();

	const installedApps = client.getInstalledApps.createQuery();
</script>

{#if $installedApps.isLoading}
	<ProgressRadial />
{:else if $installedApps.error}
	<Error text={$installedApps.error.message} />
{:else if $installedApps.isSuccess}
	{#each $installedApps.data as app}
		<p>{app.installed_app_id}</p>
	{/each}
	{#if $installedApps.data.length === 0}
		<p>{$i18n.t('noAppsInstalled')}</p>
	{/if}
{/if}
