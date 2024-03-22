<script lang="ts">
	import { onMount } from 'svelte';

	import { goto } from '$app/navigation';
	import { createAppStoreClient, trpc } from '$services';
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
		const unsubscribe = appPort.subscribe(async ({ isSuccess, data }) => {
			if (isSuccess && typeof data === 'number') {
				await createAppStoreClient(data);
				unsubscribe();
			}
		});

		window.addEventListener('keydown', handleEscapeKey);
		return () => {
			window.removeEventListener('keydown', handleEscapeKey);
		};
	});
</script>

<slot />
