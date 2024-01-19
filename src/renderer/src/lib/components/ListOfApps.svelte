<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton';

	import { validateApp } from '$helpers';
	import { trpc } from '$services';

	const client = trpc();

	export let searchInput: string;

	const openApp = client.openApp.createMutation();

	const installedApps = client.getInstalledApps.createQuery();

	const handleClick = (app: unknown) => {
		if (validateApp(app)) {
			$openApp.mutate(app);
		}
	};
</script>

<div class="align-center flex grow justify-center bg-apps-list-dark-gradient bg-fixed">
	{#if $installedApps.isSuccess}
		<div
			class="flex snap-x snap-mandatory scroll-px-4 gap-4 self-center overflow-x-auto scroll-smooth px-4 pt-4"
		>
			{#each $installedApps.data.filter((app) => app.appInfo.installed_app_id
					.toLowerCase()
					.includes(searchInput.toLowerCase())) as app}
				{@const isDisabled = 'disabled' in app.appInfo.status}
				<button
					type="button"
					class:cursor-not-allowed={isDisabled}
					class:opacity-50={isDisabled}
					class="flex shrink-0 snap-start flex-col items-center"
					on:click={() => {
						if (!isDisabled) handleClick(app);
					}}
				>
					<Avatar
						initials={app.appInfo.installed_app_id}
						rounded="rounded-2xl"
						background="bg-icon-gradient"
					/>
					<span class="text-xs">{app.appInfo.installed_app_id}</span>
				</button>
			{/each}
		</div>
	{/if}
</div>
