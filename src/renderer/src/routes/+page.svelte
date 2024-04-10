<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';

	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { CenterProgressRadial } from '$components';
	import { showModalError } from '$helpers';
	import { i18n, trpc } from '$services';
	import { SETTINGS_SCREEN } from '$shared/const';

	const client = trpc();

	const modalStore = getModalStore();

	const lairSetupRequired = client.lairSetupRequired.createQuery();

	onMount(() => {
		const url = $page.url;

		if (url.searchParams.get('screen') === SETTINGS_SCREEN) {
			return goto(`/${SETTINGS_SCREEN}`);
		}

		return lairSetupRequired.subscribe((setupData) => {
			if (setupData.isError) {
				console.error(setupData.error);
				return showModalError({
					modalStore,
					errorTitle: $i18n.t('appError'),
					errorMessage: $i18n.t(setupData.error.message)
				});
			}

			if (setupData.isSuccess) {
				return goto(setupData.data ? '/welcome' : '/enter-password');
			}
		});
	});
</script>

<CenterProgressRadial />
