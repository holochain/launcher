<script lang="ts">
	import '../app.postcss';

	import { arrow, autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom';
	import {
		initializeStores,
		Modal,
		type ModalComponent,
		storePopup,
		Toast
	} from '@skeletonlabs/skeleton';
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';

	import { onNavigate } from '$app/navigation';
	import {
		MODAL_DEVHUB_INSTALLATION_CONFIRMATION,
		MODAL_INSTALL_FROM_FILE,
		MODAL_INSTALL_KANDO
	} from '$const';
	import { startViewTransition } from '$helpers';
	import { DevHubInstallationConfirmation, InstallFromFile, InstallKando } from '$modal';

	const queryClient = new QueryClient();

	const modalRegistry: Record<string, ModalComponent> = {
		[MODAL_INSTALL_FROM_FILE]: { ref: InstallFromFile },
		[MODAL_INSTALL_KANDO]: { ref: InstallKando },
		[MODAL_DEVHUB_INSTALLATION_CONFIRMATION]: { ref: DevHubInstallationConfirmation }
	};

	const setupStorePopup = () => {
		storePopup.set({ computePosition, autoUpdate, offset, shift, flip, arrow });
	};

	onNavigate(startViewTransition);

	initializeStores();
	setupStorePopup();
</script>

<QueryClientProvider client={queryClient}>
	<Modal components={modalRegistry} />
	<Toast
		position="br"
		color="!text-white"
		background="variant-filled-surface"
		buttonDismiss="!bg-transparent !text-white"
	/>
	<div class="flex h-full min-w-80 flex-col">
		<slot />
	</div>
</QueryClientProvider>
