<script lang="ts">
	import { encodeHashToBase64 } from '@holochain/client';

	import { Button } from '$components';
	import { getCellId } from '$helpers';
	import { i18n, trpc } from '$services';

	import type { ExtendedAppInfo } from '../../../../types';

	const client = trpc();

	const openApp = client.openApp.createMutation();
	const installedApps = client.getInstalledApps.createQuery();
	const uninstallApp = client.uninstallApp.createMutation();

	export let app: ExtendedAppInfo;
</script>

<div class="flex flex-col rounded border p-2">
	<div class="2 flex items-center justify-between">
		<h2 class="header mb-2">{app.appInfo.installed_app_id}</h2>
		<div class="flex items-center space-x-2">
			<Button
				props={{
					disabled: 'disabled' in app.appInfo.status,
					onClick: () => {
						$openApp.mutate(app);
					}
				}}
			>
				{$i18n.t('Open')}
			</Button>
			<Button
				props={{
					onClick: () => {
						$uninstallApp.mutate(app, {
							onSuccess: () => {
								$installedApps.refetch();
							}
						});
					}
				}}
			>
				{$i18n.t('Uninstall')}
			</Button>
		</div>
	</div>
	{#each Object.entries(app.appInfo.cell_info) as [roleName, cellId]}
		{@const cellIdResult = getCellId(cellId[0])}
		{#if cellIdResult}
			<p class="break-all">
				{roleName}: {encodeHashToBase64(cellIdResult[0])}
			</p>
		{/if}
	{/each}
</div>
