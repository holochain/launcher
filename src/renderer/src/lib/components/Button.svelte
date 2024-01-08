<script lang="ts">
	import type { ButtonProps } from '$types';

	export let props: ButtonProps;

	$: ({ onClick, ...rest } = props);
</script>

<button on:click={onClick} {...rest} class="variant-filled btn mb-2">
	<slot />
</button>
