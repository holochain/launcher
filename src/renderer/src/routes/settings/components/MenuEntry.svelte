<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton';

	export let onClick = () => {};
	export let name: string;
	export let isApp = false;
</script>

<button
	class="flex cursor-pointer items-center p-2"
	on:click={onClick}
	aria-label={`Select ${name}`}
>
	{#if isApp}
		<Avatar
			initials={name.substring(0, 2).toUpperCase()}
			fill="fill-current text-white"
			background="dark:bg-app-gradient"
			fontSize={250}
			width="w-4"
			rounded="rounded-sm"
		/>
	{/if}
	<span class="ml-3 text-base font-light opacity-50">{name}</span>
</button>
