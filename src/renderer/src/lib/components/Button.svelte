<script lang="ts">
	import { ProgressRadial } from '@skeletonlabs/skeleton';

	import type { ButtonProps } from '$types';

	export let props: ButtonProps;

	$: ({
		onClick,
		class: btnClass = 'btn-primary',
		style,
		type = 'button',
		isLoading,
		disabled,
		...rest
	} = props);
</script>

<button on:click={onClick} class={btnClass} style={style} {type} disabled={isLoading || disabled} {...rest}>
	{#if isLoading}
		<ProgressRadial stroke={100} width="w-6" />
	{:else}
		<slot />
	{/if}
</button>
