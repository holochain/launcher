<script lang="ts">
	import type { InputProps } from '$types';

	export let props: InputProps;
	export let value: string | null = null;
	export let files: FileList | null = null;

	$: ({ type, class: iptClass = 'input placeholder-white text-sm mb-2', ...rest } = props);
</script>

{#if type === 'file'}
	<input type="file" bind:files {...rest} class={iptClass} />
{:else}
	<input bind:value {...props} class={iptClass} />
{/if}
