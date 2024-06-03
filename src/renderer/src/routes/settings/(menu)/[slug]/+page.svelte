<script lang="ts">
	import { decodeHashFromBase64, encodeHashToBase64 } from '@holochain/client';
	import { getModalStore, getToastStore } from '@skeletonlabs/skeleton';
	import type { AppVersionEntry } from 'appstore-tools';
	import clsx from 'clsx';

	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { AppDetailsPanel, Button } from '$components';
	import { MODAL_DEVHUB_INSTALLATION_CONFIRMATION } from '$const';
	import {
		capitalizeFirstLetter,
		createModalParams,
		filterHash,
		getAppStoreDistributionHash,
		getCellId,
		getVersionByActionHash,
		showModalError,
		validateApp
	} from '$helpers';
	import { Download } from '$icons';
	import { createAppQueries } from '$queries';
	import { createDevHubClient, i18n, trpc } from '$services';
	import { DISTRIBUTION_TYPE_APPSTORE, SETTINGS_SCREEN } from '$shared/const';
	import { getErrorMessage } from '$shared/helpers';
	import type { UpdateUiFromHash } from '$shared/types';

	import { DashedSection } from '../../components';

	const client = trpc();

	const modalStore = getModalStore();
	const toastStore = getToastStore();

	const { checkForAppUiUpdatesQuery, fetchUiBytesMutation, appVersionsAppstoreQueryFunction } =
		createAppQueries();

	const utils = client.createUtils();

	const installedApps = client.getInstalledApps.createQuery();
	const uninstallApp = client.uninstallApp.createMutation();
	const isDevhubInstalled = client.isDevhubInstalled.createQuery();
	const installDevhub = client.installDevhub.createMutation();
	const updateUiFromHash = client.updateUiFromHash.createMutation();
	const storeUiBytes = client.storeUiBytes.createMutation();

	let selectedIndex = 0;

	$: selectedApp = $installedApps.data?.find(
		(app) => app.appInfo.installed_app_id === $page.params.slug
	);
	$: selectedAppDistributionInfoData =
		selectedApp?.distributionInfo.type === DISTRIBUTION_TYPE_APPSTORE
			? selectedApp.distributionInfo
			: undefined;
	$: uiUpdates = checkForAppUiUpdatesQuery(
		$installedApps?.data
			?.map((app) => getAppStoreDistributionHash(app.distributionInfo))
			.filter(filterHash) ?? []
	);
	$: update =
		selectedApp && uiUpdates && selectedAppDistributionInfoData
			? $uiUpdates.data?.[selectedAppDistributionInfoData.appVersionActionHash]
			: undefined;

	$: appVersionsDetailsQuery = appVersionsAppstoreQueryFunction(
		decodeHashFromBase64(selectedAppDistributionInfoData?.appEntryActionHash ?? '')
	);

	const onSuccess = () => {
		$installedApps.refetch();
		$uiUpdates.refetch();
		modalStore.close();

		toastStore.trigger({
			message: `${selectedApp?.appInfo.installed_app_id} ${$i18n.t('isUpdatedSuccessfully')}`
		});
	};

	const handleError = (error: unknown) => {
		console.error(error);
		modalStore.close();
		showModalError({
			modalStore,
			errorTitle: $i18n.t('appError'),
			errorMessage: getErrorMessage(error)
		});
	};

	const updateUIFromHashLogic = (updateInfo: UpdateUiFromHash) =>
		$updateUiFromHash.mutate(updateInfo, { onSuccess, onError: handleError });

	const fetchAndStoreUiBytesLogic = ({
		appVersionEntry,
		updateInfo
	}: {
		appVersionEntry: AppVersionEntry;
		updateInfo: UpdateUiFromHash;
	}) => {
		$fetchUiBytesMutation.mutate(appVersionEntry, {
			onSuccess: (bytes) =>
				$storeUiBytes.mutate(
					{ bytes },
					{
						onSuccess: () =>
							updateUIFromHashLogic({
								appId: updateInfo.appId,
								uiZipSha256: updateInfo.uiZipSha256,
								appVersionActionHash: updateInfo.appVersionActionHash
							}),
						onError: handleError
					}
				),
			onError: handleError
		});
	};

	const updateUI = async ({
		appVersionEntry,
		updateInfo
	}: {
		appVersionEntry: AppVersionEntry;
		updateInfo: UpdateUiFromHash;
	}) => {
		const areUiBytesAvailable = await utils.areUiBytesAvailable.fetch(updateInfo.uiZipSha256);

		if (areUiBytesAvailable) {
			return updateUIFromHashLogic(updateInfo);
		}

		return fetchAndStoreUiBytesLogic({
			appVersionEntry,
			updateInfo
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

	const showModal = () => {
		const modal = createModalParams(MODAL_DEVHUB_INSTALLATION_CONFIRMATION, (shouldInstall) => {
			if (shouldInstall) {
				$installDevhub.mutate(undefined, {
					onSuccess: handleDevhubInstallSuccess,
					onError: handleError
				});
			}
		});

		modalStore.trigger(modal);
	};
</script>

{#if selectedApp}
	{@const appVersion = getVersionByActionHash(
		$appVersionsDetailsQuery?.data,
		selectedAppDistributionInfoData?.appVersionActionHash ?? ''
	)}
	<AppDetailsPanel
		{appVersion}
		title={selectedApp.appInfo.installed_app_id}
		buttons={[$i18n.t('details'), capitalizeFirstLetter($i18n.t('settings'))]}
		bind:selectedIndex
	/>
	{#if update && selectedApp.distributionInfo.type === DISTRIBUTION_TYPE_APPSTORE}
		<DashedSection borderColor="border-warning-500/30">
			<div class="flex w-full items-center justify-between">
				<h3 class="h3 text-warning-500">{$i18n.t('updateAvailable')}</h3>
				<div class="flex items-center">
					<p>{appVersion}</p>
					<h3 class="h3 mx-2 text-warning-500">→</h3>
					<p>
						{update.content.version}
					</p>
				</div>

				<Button
					props={{
						onClick: async () => {
							if (selectedApp.distributionInfo.type !== DISTRIBUTION_TYPE_APPSTORE) {
								return;
							}
							updateUI({
								appVersionEntry: update.content,
								updateInfo: {
									appId: selectedApp.appInfo.installed_app_id,
									uiZipSha256: update.content.bundle_hashes.ui_hash,
									appVersionActionHash: encodeHashToBase64(update.id)
								}
							});
						},
						class: 'btn bg-warning-500',
						isLoading:
							$fetchUiBytesMutation.isPending ||
							$storeUiBytes.isPending ||
							$updateUiFromHash.isPending
					}}
				>
					<div class="mr-2"><Download /></div>
					{$i18n.t('install')}
				</Button>
			</div>
		</DashedSection>
	{/if}
	{#if selectedIndex === 0}
		<div class="px-8 py-4">
			<p>{$i18n.t('details')}</p>
		</div>
	{:else if selectedIndex === 1}
		<div class={clsx('p-8', update && 'pt-0')}>
			<div class="flex items-center justify-between">
				<Button
					props={{
						onClick: () =>
							validateApp(selectedApp) &&
							$uninstallApp.mutate(selectedApp, {
								onSuccess: () => {
									$installedApps.refetch();
									goto(`/${SETTINGS_SCREEN}`);
								}
							}),
						class: 'btn-app-store variant-filled'
					}}
				>
					{$i18n.t('uninstall')}
				</Button>
			</div>
			{#each Object.entries(selectedApp.appInfo.cell_info) as [roleName, cellId]}
				{@const cellIdResult = getCellId(cellId[0])}
				{#if cellIdResult}
					<p class="break-all">
						{roleName}: {encodeHashToBase64(cellIdResult[0])}
					</p>
				{/if}
			{/each}
		</div>
	{/if}
{:else}
	<DashedSection title={$i18n.t('developerTools')}>
		{#if $isDevhubInstalled.data}
			<p>{$i18n.t('devhubInstalled')}</p>
		{:else}
			<Button
				props={{
					isLoading: $installDevhub.isPending,
					onClick: showModal,
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
{/if}
