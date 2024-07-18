<script lang="ts">
	import { ProgressRadial } from '@skeletonlabs/skeleton';
	import clsx from 'clsx';

	import { i18n } from '$services';

	export let onClick: (event: MouseEvent) => void;
	export let loadingString = '';
	export let disabled: boolean;
</script>

<button
	on:click={onClick}
	class={clsx('btn-app-store variant-filled', {
		'!bg-primary-700/90 !text-white !opacity-100': disabled
	})}
	type="button"
	{disabled}
>
	{#if disabled}
		<span>{$i18n.t(loadingString)}</span>
		<ProgressRadial
			meter={'stroke-[#00A3FF]'}
			track="stroke-surface-900"
			stroke={100}
			width="w-6"
		/>
	{:else}
		<slot />
	{/if}
</button>
