<script lang="ts">
	import { onMount } from 'svelte';

	import { goto } from '$app/navigation';
	import { trpc } from '$services';

	const client = trpc();

	const hideApp = client.hideApp.createMutation();

	const handleEscapeKey = (event: KeyboardEvent): void => {
		if (event.key === 'Escape') {
			$hideApp.mutate();
			goto('/main/apps-view');
		}
	};

	client.mainScreenRoute.createSubscription(undefined, {
		onData: (data: string) => {
			goto(`/main/${data}`);
		}
	});

	onMount(() => {
		window.addEventListener('keydown', handleEscapeKey);
		return () => {
			window.removeEventListener('keydown', handleEscapeKey);
		};
	});
</script>

<slot />
