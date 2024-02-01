<script lang="ts">
	import type { ButtonProps } from '$types';

	export let props: ButtonProps;

	$: ({ onClick, class: btnClass = 'btn-primary', type = 'button', ...rest } = props);
</script>

<button on:click={onClick} class={btnClass} {type} {...rest}>
	<slot />
</button>
