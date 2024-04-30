<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton';

	import { Button } from '$components';

	export let imageUrl: string | undefined = undefined;
	export let title: string;
	export let buttons: Array<string>;
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
