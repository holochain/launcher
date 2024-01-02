<script lang="ts">
	import type { InputProps } from '$types';

	export let props: InputProps;
	export let value: string | null = null;
	export let files: FileList | null = null;

	$: ({ type, ...rest } = props);
</script>

{#if type === 'file'}
	<input type="file" bind:files {...rest} class="input mb-4 max-w-xs" />
{:else}
	<input bind:value {...props} class="input mb-4 max-w-xs" />
{/if}
