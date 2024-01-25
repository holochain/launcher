<script lang="ts">
	import { onMount } from 'svelte';

	import { trpc } from '$services';

	const client = trpc();

	const hideApp = client.hideApp.createMutation();

	const handleEscapeKey = (event: KeyboardEvent): void => {
		if (event.key === 'Escape') {
			$hideApp.mutate();
		}
	};

	onMount(() => {
		window.addEventListener('keydown', handleEscapeKey);
		return () => {
			window.removeEventListener('keydown', handleEscapeKey);
		};
	});
</script>

<div class="flex h-full flex-col">
	<slot />
</div>
