<script lang="ts">
	import { Button } from '$components';
	export let onClick: (() => void) | undefined = undefined;
	export let buttonClass: string = 'p-2 group';
	export let title: string | undefined = undefined;
</script>

<Button
	props={{
		class: `app-region-no-drag ${buttonClass}`,
		onClick,
		title
	}}
>
	<slot />
</Button>
