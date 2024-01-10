<script lang="ts">
	import { ProgressRadial } from '@skeletonlabs/skeleton';

	import { Button, Error, InstallAppForm } from '$components';
	import { validateApp } from '$helpers';
	import { i18n, trpc } from '$services';

	const client = trpc();

	const installedApps = client.getInstalledApps.createQuery();
	const openApp = client.openApp.createMutation();
	const uninstallApp = client.uninstallApp.createMutation();
</script>

<InstallAppForm />

<div class="col center-content mx-auto max-w-xs space-y-2 text-center">
	{#if $installedApps.isLoading}
		<ProgressRadial />
	{:else if $installedApps.error}
		<Error text={$installedApps.error.message} />
	{:else if $installedApps.isSuccess}
		{#each $installedApps.data as app}
			<div class="flex items-center justify-between rounded border p-2">
				<h2 class="header mb-2">{app.appInfo.installed_app_id}</h2>
				<div class="flex items-center space-x-2">
					<Button
						props={{
							onClick: () => {
								if (validateApp(app)) {
									$openApp.mutate(app);
								}
							}
						}}
					>
						{$i18n.t('Open')}
					</Button>
					<Button
						props={{
							onClick: () => {
								if (validateApp(app)) {
									$uninstallApp.mutate(app, {
										onSuccess: () => {
											$installedApps.refetch();
										}
									});
								}
							}
						}}
					>
						{$i18n.t('Uninstall')}
					</Button>
				</div>
			</div>
		{/each}
		{#if $installedApps.data.length === 0}
			<p>{$i18n.t('noAppsInstalled')}</p>
		{/if}
	{/if}
</div>
