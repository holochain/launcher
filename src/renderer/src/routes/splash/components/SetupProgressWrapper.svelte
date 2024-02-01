<script lang="ts">
	import { i18n, trpc } from '$services';

	let setupProgress = '';

	const client = trpc();

	client.onSetupProgressUpdate.createSubscription(undefined, {
		onData: (data) => {
			setupProgress = data;
		}
	});
</script>

{#if setupProgress}
	<h2 class="h2">{$i18n.t(setupProgress)}</h2>
{:else}
	<slot />
{/if}
