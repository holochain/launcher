<script lang="ts">
	import { Button } from '$components';
	export let onClick: (() => void) | undefined = undefined;
	export let buttonClass: string = '';
</script>

<Button
	props={{
		class: `p-2 app-region-no-drag ${buttonClass}`,
		onClick
	}}
>
	<slot />
</Button>
