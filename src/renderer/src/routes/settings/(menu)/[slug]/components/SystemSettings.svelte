<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';

	import { Button, NoClickOverlay } from '$components';
	import { MODAL_DEVHUB_INSTALLATION_CONFIRMATION, MODAL_FACTORY_RESET_CONFIRMATION } from '$const';
	import { createModalParams, showModalError } from '$helpers';
	import { Download } from '$icons';
	import { createDevHubClient, i18n, trpc } from '$services';
	import { getErrorMessage } from '$shared/helpers';
	import type { Modals } from '$types';

	import { DashedSection } from '../../../components';

	const modalStore = getModalStore();

	const client = trpc();
	const isDevhubInstalled = client.isDevhubInstalled.createQuery();
	const installDevhub = client.installDevhub.createMutation();
	const factoryReset = client.factoryReset.createMutation();

	const handleError = (error: unknown) => {
		console.error(error);
		const errorMessage = getErrorMessage(error);

		modalStore.close();
		showModalError({
			modalStore,
			errorTitle: $i18n.t('appError'),
			errorMessage: $i18n.t(errorMessage)
		});
	};

	const handleDevhubInstallSuccess = async ({
		appPort,
		authenticationToken
	}: {
		appPort?: number;
		authenticationToken: number[];
	}) => {
		if (!appPort) {
			handleError({
				message: $i18n.t('noAppPortError'),
				title: $i18n.t('appError')
			});
			return;
		}
		await createDevHubClient(appPort, authenticationToken);
		$isDevhubInstalled.refetch();
		modalStore.close();
	};

	const showModal = (modalType: Modals, response?: (r: unknown) => void) => {
		const modal = createModalParams(modalType, response);
		modalStore.trigger(modal);
	};

	const showDevhubInstallModal = () => {
		showModal(MODAL_DEVHUB_INSTALLATION_CONFIRMATION, (shouldInstall) => {
			if (shouldInstall) {
				$installDevhub.mutate(undefined, {
					onSuccess: handleDevhubInstallSuccess,
					onError: handleError
				});
			}
		});
	};

	const showFactoryResetModal = () => {
		showModal(MODAL_FACTORY_RESET_CONFIRMATION, (confirm) => {
			if (confirm) {
				$factoryReset.mutate(undefined, {
					onError: (error) =>
						showModalError({
							modalStore,
							errorTitle: $i18n.t('factoryResetError'),
							errorMessage: error.message
						})
				});
			}
		});
	};
</script>

{#if $installDevhub.isPending}
	<NoClickOverlay />
{/if}
<div class="flex flex-1 flex-col pt-3">
	<DashedSection containerClasses="m-2 p-2.5" title={$i18n.t('developerTools')}>
		{#if $isDevhubInstalled.data}
			<p>{$i18n.t('devhubInstalled')}</p>
		{:else}
			<Button
				props={{
					isLoading: $installDevhub.isPending,
					onClick: showDevhubInstallModal,
					class: 'btn-install'
				}}
			>
				<div class="mr-2"><Download /></div>
				{$i18n.t('install')}
			</Button>
			<div class="text-sm">
				<span class="font-normal">{$i18n.t('developerToolsAllow')}</span>
				<span class="font-semibold">{$i18n.t('uploadAndPublish')}</span>
			</div>
		{/if}
	</DashedSection>
	<span class="flex flex-1"></span>
	<div class="flex flex-row pr-2">
		<span class="flex flex-1"></span>
		<span class="font-semibold text-red-600 opacity-80">DANGER ZONE</span>
	</div>
	<div class="pb-3 pt-4" style="background-color: #ff000014">
		<DashedSection containerClasses="m-2 p-2.5" title={$i18n.t('factoryReset')}>
			<div class="flex flex-col justify-center">
				<div class="mb-2">{$i18n.t('factoryResetHolochainLauncher')}</div>
				<div class="flex flex-row">
					<Button
						props={{
							disabled: $installDevhub.isPending,
							onClick: showFactoryResetModal,
							class: 'btn-install !bg-error-500'
						}}
					>
						{$i18n.t('factoryReset')}
					</Button>
					<span class="flex flex-1"></span>
				</div>
			</div>
		</DashedSection>
	</div>
</div>
