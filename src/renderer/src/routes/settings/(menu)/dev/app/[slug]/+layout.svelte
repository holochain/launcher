<script lang="ts">
	import { page } from '$app/stores';
	import { AppDetailsPanel } from '$components';
	import { createImageUrl, uint8ArrayToURIComponent } from '$helpers';
	import { createAppQueries } from '$queries';
	import { i18n } from '$services';

	const { appStoreMyHappsQuery } = createAppQueries();

	$: view = $page.params.slug;
</script>

{#if $appStoreMyHappsQuery.isSuccess}
	{@const app = $appStoreMyHappsQuery.data.find((app) => uint8ArrayToURIComponent(app.id) === view)}
	{#if app}
		{@const imageUrl = createImageUrl(app.icon)}

		<AppDetailsPanel {imageUrl} title={app.title} buttons={[$i18n.t('releases')]} />
	{/if}
{/if}
<div class="px-8 py-6">
	<slot />
</div>
