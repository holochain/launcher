<script lang="ts">
	import { uint8ArrayToURIComponent } from '$helpers';
	import { createAppQueries } from '$queries';

	import { AppCard, InstallFromDeviceCard } from './components';

	let searchInput = '';

	$: isKandoInSearch = 'kando'.includes(searchInput.toLowerCase());

	const { appStoreHappsQuery } = createAppQueries();
</script>

<div class="grow bg-light-background p-4 dark:bg-apps-list-dark-gradient">
	<div class="text-token grid w-full gap-4 md:grid-cols-2">
		{#each $appStoreHappsQuery.isSuccess ? $appStoreHappsQuery.data : [] as app}
			<AppCard
				icon={app.icon}
				title={app.title}
				subtitle={app.subtitle}
				id={uint8ArrayToURIComponent(app.id)}
			/>
		{/each}
		{#if isKandoInSearch}
			<AppCard />
		{/if}
		<InstallFromDeviceCard />
	</div>
</div>
