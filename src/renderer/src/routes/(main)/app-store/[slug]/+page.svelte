<script lang="ts">
	import { page } from '$app/stores';
	import { createAppQueries } from '$queries';

	const { appStoreHappsQuery, appDetailsQueryFunction } = createAppQueries();

	const slug: string = $page.params.slug;
	const app = $appStoreHappsQuery.data?.find(({ id }) => id === slug);

	$: appDetailsQuery = app ? appDetailsQueryFunction(app.apphubHrlTarget) : undefined;
</script>

{#if app}
	<span>{app.title}</span>
	<span>{$appDetailsQuery?.data}</span>
{:else}
	<span>App not found</span>
{/if}

{#if $appDetailsQuery && $appDetailsQuery.isError}
	<span>{$appDetailsQuery.error?.message}</span>
{/if}
