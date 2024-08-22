<script lang="ts">
	import { Button } from '$components';
	export let onClick: (() => void) | undefined = undefined;
	export let buttonClass: string = 'p-2 group';
</script>

<Button
	props={{
		class: `app-region-no-drag ${buttonClass}`,
		onClick
	}}
>
	<slot />
</Button>
