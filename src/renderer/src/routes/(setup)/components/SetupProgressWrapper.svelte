<script lang="ts">
	import { i18n, trpc } from '$services';
	import { setupProgress } from '$stores/setup';

	const client = trpc();

	client.onSetupProgressUpdate.createSubscription(undefined, {
		onData: (data) => {
			setupProgress.set(data);
		}
	});
</script>

{#if $setupProgress}
	<h2 class="h2">{$i18n.t($setupProgress)}</h2>
{:else}
	<slot />
{/if}
