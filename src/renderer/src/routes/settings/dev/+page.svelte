<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton';

	import { page } from '$app/stores';
	import { VIEW } from '$const';
	import { createImageUrl, getRawQueryParam } from '$helpers';
	import { createAppQueries } from '$queries';

	import { ReleasesCard } from './components';

	const { appStoreMyHappsQuery } = createAppQueries();

	$: view = getRawQueryParam($page.url.href, VIEW);
</script>

<div class="p-8">
	{#if $appStoreMyHappsQuery.isSuccess}
		{@const app = $appStoreMyHappsQuery.data.find((app) => app.id === view)}
		{#if app}
			{@const imageUrl = createImageUrl(app.icon)}
			<div class="flex items-center space-x-4 pb-4">
				<Avatar
					src={imageUrl}
					initials={app.title}
					fill="fill-current text-white"
					background="dark:bg-app-gradient"
					rounded="rounded-sm"
				/>
				<h2 class="text-lg font-bold">{app.title}</h2>
			</div>
			<ReleasesCard apphubHrlTarget={app.apphubHrlTarget} />
		{/if}
	{/if}
</div>
