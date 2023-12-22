<script lang="ts">
	import type { ButtonProps } from '$types';

	export let props: ButtonProps;

	const { onClick, ...rest } = props;
</script>

<button on:click={onClick} {...rest} class="btn variant-filled mb-2">
	<slot />
</button>
