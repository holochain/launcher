<script lang="ts">
	import { page } from '$app/stores';
	import { AppDetailsPanel } from '$components';
	import { createImageUrl, uint8ArrayToURIComponent } from '$helpers';
	import { createAppQueries } from '$queries';
	import { i18n } from '$services';

	const { appStoreHappsQuery, appVersionsAppstoreQueryFunction } = createAppQueries();

	const slug: string = $page.params.slug;
	const app = $appStoreHappsQuery.data?.find(({ id }) => uint8ArrayToURIComponent(id) === slug);

	$: appVersionsDetailsQuery = app ? appVersionsAppstoreQueryFunction(app.id) : undefined;
</script>

{#if app}
	<AppDetailsPanel
		imageUrl={createImageUrl(app.icon)}
		title={app.title}
		buttons={[$i18n.t('Version History')]}
	/>
{/if}

{#if $appVersionsDetailsQuery?.data}
	{#each $appVersionsDetailsQuery.data as versionEntry}
		<div class="flex items-center pl-8 pt-2">
			<h4 class="font-semibold">{versionEntry.content.version}</h4>
		</div>
	{/each}
{/if}
