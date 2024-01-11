<script lang="ts">
	import type { ButtonProps } from '$types';

	export let props: ButtonProps;

	$: ({ onClick, ...rest } = props);
</script>

<button on:click={onClick} {...rest} class="btn bg-custom-gradient mb-2 rounded font-semibold">
	<slot />
</button>
