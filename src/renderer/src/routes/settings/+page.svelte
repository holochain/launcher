<script lang="ts">
	import { Button, CenterProgressRadial, Error } from '$components';
	import { validateApp } from '$helpers';
	import { Gear, Home, Rocket } from '$icons';
	import { i18n, trpc } from '$services';

	import { AppEntry, InstallAppForm } from './components';

	const client = trpc();

	const installedApps = client.getInstalledApps.createQuery();
</script>

<div class="app-region-drag flex justify-between p-3 dark:bg-apps-input-dark-gradient">
	<Button
		props={{
			class: 'p-2 app-region-no-drag',
			onClick: () => null
		}}
	>
		<Home />
	</Button>
	<Button
		props={{
			class: 'p-2 mr-2 app-region-no-drag',
			onClick: () => null
		}}
	>
		<Rocket />
	</Button>
	<Button
		props={{
			class: 'ml-auto app-region-no-drag p-2 bg-black rounded-md'
		}}
	>
		<Gear />
	</Button>
</div>

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
