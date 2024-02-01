<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { onDestroy } from 'svelte';

	import { goto } from '$app/navigation';
	import { CenterProgressRadial } from '$components';
	import { showModalError } from '$helpers';
	import { i18n, trpc } from '$services';

	const client = trpc();

	const modalStore = getModalStore();

	const lairSetupRequired = client.lairSetupRequired.createQuery();

	const unsubscribe = lairSetupRequired.subscribe((setupData) => {
		if (setupData.isError) {
			return showModalError({
				modalStore,
				errorTitle: $i18n.t('appError'),
				errorMessage: setupData.error.message
			});
		}

		if (setupData.isSuccess) {
			return goto(setupData.data ? '/splash/welcome' : '/splash/enter-password');
		}
	});
	onDestroy(() => {
		unsubscribe();
	});
</script>

<CenterProgressRadial />
