<script lang="ts">
	import { encodeHashToBase64 } from '@holochain/client';

	import { page } from '$app/stores';
	import { getCellId } from '$helpers';
	import { trpc } from '$services';

	const client = trpc();

	const installedApps = client.getInstalledApps.createQuery();

	$: view = $page.params.slug;
	$: filteredApps = $installedApps.data?.filter((app) => app.appInfo.installed_app_id === view);
</script>

{#if filteredApps}
	{#each filteredApps as app}
		<div>
			<h2 class="text-lg font-bold">{app.appInfo.installed_app_id}</h2>
			{#each Object.entries(app.appInfo.cell_info) as [roleName, cellId]}
				{@const cellIdResult = getCellId(cellId[0])}
				{#if cellIdResult}
					<p class="break-all">
						{roleName}: {encodeHashToBase64(cellIdResult[0])}
					</p>
				{/if}
			{/each}
		</div>
	{/each}
{/if}
