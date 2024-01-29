<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';

	import type { InputProps } from '$types';

	const dispatch = createEventDispatcher();

	let inputElement: HTMLElement;

	export let props: InputProps;
	export let value: string | null = null;
	export let autocomplete: string | null = null;
	export let files: FileList | null = null;

	function handleKeydown(event: KeyboardEvent) {
		dispatch('keydown', event);
	}

	function focusInput() {
		if (inputElement) {
			inputElement.focus();
		}
	}

	onMount(() => {
		if (props.autofocus) {
			window.addEventListener('focus', focusInput);
			return () => {
				window.removeEventListener('focus', focusInput);
			};
		}
	});

	$: ({ type, class: iptClass = 'input placeholder-white text-sm mb-2', ...rest } = props);
</script>

{#if type === 'file'}
	<input type="file" bind:files {...rest} class={iptClass} />
{:else}
	<input
		bind:this={inputElement}
		on:keydown={handleKeydown}
		bind:value
		{...props}
		class={iptClass}
	/>
	{#if autocomplete && value}
		<span class="pointer-events-none absolute left-[42px] top-[9px] opacity-50">{autocomplete}</span
		>
	{/if}
{/if}
