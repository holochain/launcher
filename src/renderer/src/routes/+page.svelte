<script lang="ts">
	import { ProgressRadial } from '@skeletonlabs/skeleton';
	import { onDestroy } from 'svelte';

	import { goto } from '$app/navigation';
	import { Error } from '$components';
	import { trpc } from '$services';

	const client = trpc();

	const lairSetupRequired = client.lairSetupRequired.createQuery();

	const unsubscribe = lairSetupRequired.subscribe((setupData) => {
		if (setupData.isSuccess) {
			return goto(setupData.data ? '/setup-lair' : '/enter-password');
		}
	});
	onDestroy(() => {
		unsubscribe();
	});
</script>

{#if $lairSetupRequired.isLoading}
	<ProgressRadial />
{:else if $lairSetupRequired.error}
	<Error text="Error loading lair setup status" />
{/if}
