<script lang="ts">
	import type { ButtonProps } from '$types';

	export let props: ButtonProps;

	$: ({ onClick, ...rest } = props);
</script>

<button on:click={onClick} {...rest} class="btn-primary">
	<slot />
</button>
