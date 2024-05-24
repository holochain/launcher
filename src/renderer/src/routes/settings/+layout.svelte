<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';

	import { initializeDefaultAppPorts, showModalError } from '$helpers';
	import { i18n, trpc } from '$services';
	import { getErrorMessage } from '$shared/helpers';

	import { TopBarSettings } from './components';

	const modalStore = getModalStore();

	const client = trpc();

	const utils = client.createUtils();

	onMount(async () => {
		try {
			const initializeDefaultAppPortsData = await utils.initializeDefaultAppPorts.fetch();
			initializeDefaultAppPorts(initializeDefaultAppPortsData);
		} catch (error) {
			showModalError({
				modalStore,
				errorTitle: $i18n.t('appError'),
				errorMessage: $i18n.t(getErrorMessage(error))
			});
		}
	});
</script>

<TopBarSettings />
<slot />
