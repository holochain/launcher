<script lang="ts">
	import { page } from '$app/stores';
	import { IconButton, TopBar } from '$components';
	import { goBack, uint8ArrayToURIComponent } from '$helpers';
	import { BackArrow } from '$icons';
	import { createAppQueries } from '$queries';
	const { appStoreAllAppsQuery } = createAppQueries();

	const slug: string = $page.params.slug;
	const app = $appStoreAllAppsQuery.data?.find(({ id }) => uint8ArrayToURIComponent(id) === slug);
</script>

<TopBar>
	<div class="relative flex w-full items-center justify-center py-[11px]">
		<IconButton buttonClass="absolute left-0" onClick={goBack}><BackArrow /></IconButton>
		<span class="text-center opacity-50">{app?.content.title}</span>
	</div>
</TopBar>

<div class="h-full bg-app-dark-gradient">
	<slot />
</div>
