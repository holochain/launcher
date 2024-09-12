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
		MODAL_DEPRECATE_APP_CONFIRMATION,
		MODAL_DEVHUB_INSTALLATION_CONFIRMATION,
		MODAL_ENTER_PASSPHRASE,
		MODAL_FACTORY_RESET_CONFIRMATION,
		MODAL_INSTALL_FROM_FILE,
		MODAL_INSTALL_KANDO,
		MODAL_STARTUP_ERROR,
		MODAL_UNINSTALL_APP_CONFIRMATION
	} from '$const';
	import { startViewTransition } from '$helpers';
	import {
		DeprecateAppConfirmation,
		DevHubInstallationConfirmation,
		FactoryResetConfirmation,
		InstallFromFile,
		InstallKando,
		StartupError,
		UninstallAppConfirmation
	} from '$modal';
	import EnterPassphrase from '$modal/EnterPassphrase.svelte';

	const queryClient = new QueryClient();

	const modalRegistry: Record<string, ModalComponent> = {
		[MODAL_INSTALL_FROM_FILE]: { ref: InstallFromFile },
		[MODAL_INSTALL_KANDO]: { ref: InstallKando },
		[MODAL_DEVHUB_INSTALLATION_CONFIRMATION]: { ref: DevHubInstallationConfirmation },
		[MODAL_ENTER_PASSPHRASE]: { ref: EnterPassphrase },
		[MODAL_FACTORY_RESET_CONFIRMATION]: { ref: FactoryResetConfirmation },
		[MODAL_DEPRECATE_APP_CONFIRMATION]: { ref: DeprecateAppConfirmation },
		[MODAL_UNINSTALL_APP_CONFIRMATION]: { ref: UninstallAppConfirmation },
		[MODAL_STARTUP_ERROR]: { ref: StartupError }
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
