<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton';
	import clsx from 'clsx';

	export let onClick = () => {};
	export let name: string;
	export let isApp = false;
	export let isSelected = false;
</script>

<button
	class={clsx('flex cursor-pointer items-center px-4 py-2', {
		'rounded-md bg-white/25': isSelected
	})}
	on:click={onClick}
	aria-label={`Select ${name}`}
>
	{#if isApp}
		<Avatar
			initials={name.substring(0, 2).toUpperCase()}
			fill="fill-current text-white"
			background="dark:bg-app-gradient"
			fontSize={250}
			width="w-4 mr-4"
			rounded="rounded-sm"
		/>
	{/if}
	<span
		class={clsx('text-base', {
			'font-light opacity-80': !isSelected,
			'font-semibold': isSelected
		})}>{name}</span
	>
</button>
