<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton';
	import type { AppVersionEntry, Entity } from 'appstore-tools';

	import { Button } from '$components';
	// import { createAppQueries } from '$queries';

	// const { fetchWebappBytesQuery } = createAppQueries();

	export let appVersions: Entity<AppVersionEntry>[] | undefined = undefined;
	export let imageUrl: string | undefined = undefined;
	export let title: string;
	export let buttons: Array<string>;

	let latestVersion: Entity<AppVersionEntry> | undefined;
	if (appVersions) {
		latestVersion = appVersions.sort((a, b) => a.content.published_at - b.content.published_at)[0];
	}

	async function installApp() {
		// if (!latestVersion) throw new Error('No latest version defined.');
		// const bytes = fetchWebappBytesQuery(latestVersion.content);
		console.log('Got bytes: ');
		console.log('Installing app.');
	}
</script>

<div class="bg-app-details-gradient p-8 pb-4">
	<div class="flex items-center space-x-4 pb-4">
		<Avatar
			width="w-20"
			src={imageUrl}
			initials={title}
			fill="fill-current text-white"
			background="dark:bg-app-gradient"
			rounded="rounded-sm"
		/>
		<h3 class="h3">{title}</h3>
		<span class="flex flex-1"></span>
		<Button
			props={{
				type: 'button',
				onClick: () => {
					installApp();
				},
				disabled: !latestVersion
			}}
		>
			Install
		</Button>
	</div>
	{#each buttons as button}
		<Button
			props={{
				type: 'button',
				onClick: () => {},
				class: 'bg-white/25 rounded-sm px-6 py-2'
			}}
		>
			{button}
		</Button>
	{/each}
</div>
