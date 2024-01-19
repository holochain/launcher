<script lang="ts">
	import type { ButtonProps } from '$types';

	export let props: ButtonProps;

	$: ({ onClick, class: btnClass = 'btn-primary', ...rest } = props);
</script>

<button on:click={onClick} class={btnClass} {...rest}>
	<slot />
</button>
