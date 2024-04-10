<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton';
	import clsx from 'clsx';

	import { createImageUrl } from '$helpers';

	export let onClick = () => {};
	export let name: string;
	export let isApp = false;
	export let isSelected = false;
	export let background = 'bg-white/25';
	export let icon: Uint8Array | undefined = undefined;

	$: imageUrl = createImageUrl(icon);
</script>

<button
	class={clsx(
		'flex cursor-pointer items-center px-4 py-2',
		isSelected && `rounded-md ${background}`
	)}
	on:click={onClick}
	aria-label={`Select ${name}`}
>
	{#if isApp}
		<Avatar
			src={imageUrl}
			initials={name.substring(0, 2).toUpperCase()}
			fill="fill-current text-white"
			background="dark:bg-app-gradient"
			fontSize={250}
			width="w-4 mr-4"
			rounded="rounded-sm"
		/>
	{/if}
	<slot name="leading" />
	<span
		class={clsx('text-base', {
			'font-light opacity-80': !isSelected,
			'font-semibold': isSelected
		})}>{name}</span
	>
</button>
