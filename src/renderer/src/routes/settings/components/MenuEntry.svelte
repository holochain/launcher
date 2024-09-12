<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton';
	import clsx from 'clsx';

	import { createImageUrl } from '$helpers';

	export let onClick = () => {};
	export let name: string;
	export let isSelected = false;
	export let isUpdateAvailable = false;
	export let background = 'bg-white/25';
	export let icon: Uint8Array | undefined = undefined;
	export let disabled = false;
</script>

<button
	class={clsx(
		'flex cursor-pointer items-center px-4 py-2',
		isSelected && `rounded-md ${background}`,
		disabled && 'opacity-50 cursor-auto',
	)}
	on:click={onClick}
	aria-label={`Select ${name}`}
	disabled={disabled}
>
	<slot name="leading">
		<Avatar
			src={createImageUrl(icon)}
			initials={name.substring(0, 2).toUpperCase()}
			fill="fill-current text-white"
			background="dark:bg-app-gradient"
			fontSize={250}
			width="w-5 mr-4"
			rounded="rounded-sm"
		/>
	</slot>
	<span
		class={clsx('text-base', {
			'font-light opacity-80': !isSelected,
			'font-semibold': isSelected || isUpdateAvailable
		})}>{name}</span
	>
	{#if isUpdateAvailable}
		<div class="ml-2 h-3 w-3 rounded-full bg-warning-500"></div>
	{/if}
</button>
