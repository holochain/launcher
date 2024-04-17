<script lang="ts">
	import { page } from '$app/stores';
	import { uint8ArrayToURIComponent } from '$helpers';
	import { createAppQueries } from '$queries';
	import { i18n } from '$services';

	const { appStoreHappsQuery, appVersionsAppstoreQueryFunction } = createAppQueries();

	const slug: string = $page.params.slug;
	const app = $appStoreHappsQuery.data?.find(({ id }) => uint8ArrayToURIComponent(id) === slug);

	$: appVersionsDetailsQuery = app ? appVersionsAppstoreQueryFunction(app.id) : undefined;
</script>

{#if app}
	<div class="flex flex-col p-4">
		<h2 class="text-lg font-bold">{app.title}</h2>
		<span>{`${$i18n.t('releases')}:`}</span>
		{#if $appVersionsDetailsQuery?.data}
			{#each $appVersionsDetailsQuery.data as versionEntry}
				<div class="flex items-center pt-2">
					<h4 class="font-semibold">{versionEntry.content.version}</h4>
				</div>
			{/each}
		{/if}
	</div>
{/if}

{#if $appVersionsDetailsQuery && $appVersionsDetailsQuery.isError}
	<div class="mt-8">
		<div class="card flex flex-col p-4">
			<span class="text-error">{$appVersionsDetailsQuery.error?.message}</span>
		</div>
	</div>
{/if}
