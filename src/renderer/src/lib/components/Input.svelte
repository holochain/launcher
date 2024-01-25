<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	import type { InputProps } from '$types';

	const dispatch = createEventDispatcher();

	export let props: InputProps;
	export let value: string | null = null;
	export let autocomplete: string | null = null;
	export let files: FileList | null = null;

	function handleKeydown(event: KeyboardEvent) {
		dispatch('keydown', event);
	}

	$: ({ type, class: iptClass = 'input placeholder-white text-sm mb-2', ...rest } = props);
</script>

{#if type === 'file'}
	<input type="file" bind:files {...rest} class={iptClass} />
{:else}
	<input on:keydown={handleKeydown} bind:value {...props} class={iptClass} />
	{#if autocomplete && value}
		<span style="left: {43 + value.length * 7}px" class="absolute top-[9px] opacity-50"
			>{autocomplete.slice(value.length)}</span
		>
	{/if}
{/if}
