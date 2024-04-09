<script lang="ts">
	import { page } from '$app/stores';
	import { VIEW } from '$const';
	import { getRawQueryParam } from '$helpers';
	import { createAppQueries } from '$queries';

	const { appStoreMyHappsQuery } = createAppQueries();

	$: view = getRawQueryParam($page.url.href, VIEW);
</script>

{#if $appStoreMyHappsQuery.isSuccess}
	{#each $appStoreMyHappsQuery.data.filter((app) => app.id === view) as app (app.id)}
		<h2 class="text-lg font-bold">{app.title}</h2>
	{/each}
{/if}
