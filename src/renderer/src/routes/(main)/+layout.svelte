<script lang="ts">
	import { onMount } from 'svelte';

	import { goto } from '$app/navigation';
	import { initializeAppPortSubscription } from '$helpers';
	import { trpc } from '$services';
	import { APPS_VIEW } from '$shared/types';

	const client = trpc();

	const hideApp = client.hideApp.createMutation();

	const appPort = client.getAppPort.createQuery();

	const handleEscapeKey = (event: KeyboardEvent): void => {
		if (event.key === 'Escape') {
			$hideApp.mutate();
			goto(`/${APPS_VIEW}`);
		}
	};

	client.mainScreenRoute.createSubscription(undefined, {
		onData: (data: string) => {
			goto(`/${data}`);
		}
	});

	onMount(() => {
		initializeAppPortSubscription(appPort);

		window.addEventListener('keydown', handleEscapeKey);
		return () => {
			window.removeEventListener('keydown', handleEscapeKey);
		};
	});
</script>

<slot />
