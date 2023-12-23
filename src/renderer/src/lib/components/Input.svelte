<script lang="ts">
	import type { InputProps } from '$types';

	export let props: InputProps;
	export let value: string | null = null;
</script>

<input bind:value {...props} class="input mb-4 max-w-xs" />
