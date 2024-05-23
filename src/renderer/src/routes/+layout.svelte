<script lang="ts">
	import '../app.postcss';

	import { initializeStores, Modal, type ModalComponent } from '@skeletonlabs/skeleton';
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';

	import {
		MODAL_DEVHUB_INSTALLATION_CONFIRMATION,
		MODAL_INSTALL_FROM_FILE,
		MODAL_INSTALL_KANDO
	} from '$const';
	import { DevHubInstallationConfirmation, InstallFromFile, InstallKando } from '$modal';

	const queryClient = new QueryClient();

	const modalRegistry: Record<string, ModalComponent> = {
		[MODAL_INSTALL_FROM_FILE]: { ref: InstallFromFile },
		[MODAL_INSTALL_KANDO]: { ref: InstallKando },
		[MODAL_DEVHUB_INSTALLATION_CONFIRMATION]: { ref: DevHubInstallationConfirmation }
	};

	initializeStores();
</script>

<QueryClientProvider client={queryClient}>
	<Modal components={modalRegistry} />
	<div class="flex h-full min-w-80 flex-col">
		<slot />
	</div>
</QueryClientProvider>
