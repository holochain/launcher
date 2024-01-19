<script lang="ts">
	import { goto } from '$app/navigation';
	import { i18n, trpc } from '$services';

	let setupProgress = '';

	const client = trpc();

	client.onSetupProgressUpdate.createSubscription(undefined, {
		onData: (data) => {
			if (data === 'settings') {
				goto('/settings');
			}
			setupProgress = data;
		}
	});
</script>

{#if setupProgress}
	<h2 class="h2">{$i18n.t(setupProgress)}</h2>
{:else}
	<slot />
{/if}
