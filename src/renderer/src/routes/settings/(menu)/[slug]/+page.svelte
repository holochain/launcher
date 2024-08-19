<script lang="ts">
	import { decodeHashFromBase64, encodeHashToBase64 } from '@holochain/client';
	import { getModalStore, getToastStore, SlideToggle } from '@skeletonlabs/skeleton';
	import type { AppVersionEntry } from 'appstore-tools';

	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { AppDetailsPanel, Button } from '$components';
	import { KEY_MANAGEMENT, MODAL_UNINSTALL_APP_CONFIRMATION } from '$const';
	import {
		capitalizeFirstLetter,
		createImageUrl,
		createModalParams,
		filterHash,
		getAppStoreDistributionHash,
		getCellId,
		getVersionByActionHash,
		isDev,
		showModalError,
		validateApp
	} from '$helpers';
	import { Download } from '$icons';
	import { createAppQueries } from '$queries';
	import { i18n, trpc } from '$services';
	import { DISTRIBUTION_TYPE_APPSTORE, SETTINGS_WINDOW } from '$shared/const';
	import { getErrorMessage } from '$shared/helpers';
	import { type UpdateUiFromHash } from '$shared/types';
	import type { Modals } from '$types';

	import { DashedSection } from '../../components';
	import AppSettings from './components/AppSettings.svelte';
	import KeyManagement from './components/KeyManagement.svelte';
	import SystemSettings from './components/SystemSettings.svelte';

	const client = trpc();

	const modalStore = getModalStore();
	const toastStore = getToastStore();

	const {
		checkForAppUiUpdatesQuery,
		fetchUiBytesMutation,
		appVersionsAppstoreQueryFunction,
		getAppDetailsQuery
	} = createAppQueries();

	const utils = client.createUtils();

	const installedApps = client.getInstalledApps.createQuery(true);
	const uninstallApp = client.uninstallApp.createMutation();
	const toggleApp = client.toggleApp.createMutation();

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
			.filter(filterHash) ?? [],
		isDev()
	);
	$: update =
		selectedApp && uiUpdates && selectedAppDistributionInfoData
			? $uiUpdates?.data?.[selectedAppDistributionInfoData.appVersionActionHash]
			: undefined;

	$: appVersionsDetailsQuery = selectedAppDistributionInfoData?.appEntryActionHash
		? appVersionsAppstoreQueryFunction(
				decodeHashFromBase64(selectedAppDistributionInfoData.appEntryActionHash)
			)
		: undefined;

	$: appDetailsQuery = selectedAppDistributionInfoData?.appEntryActionHash
		? getAppDetailsQuery(decodeHashFromBase64(selectedAppDistributionInfoData.appEntryActionHash))
		: undefined;

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
		const errorMessage = getErrorMessage(error);

		modalStore.close();
		showModalError({
			modalStore,
			errorTitle: $i18n.t('appError'),
			errorMessage: $i18n.t(errorMessage)
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

	const showModal = (modalType: Modals, response?: (r: unknown) => void) => {
		const modal = createModalParams(modalType, response);
		modalStore.trigger(modal);
	};

	const showUninstallModal = () => {
		showModal(MODAL_UNINSTALL_APP_CONFIRMATION, (confirm) => {
			if (confirm) {
				validateApp(selectedApp) &&
					$uninstallApp.mutate(selectedApp, {
						onSuccess: () => {
							$installedApps.refetch();
							goto(`/${SETTINGS_WINDOW}`);
						}
					});
			}
		});
	};

	$: icon = selectedApp?.icon ? new Uint8Array(selectedApp.icon) : undefined;
</script>

{#if selectedApp}
	{@const appVersion = getVersionByActionHash(
		$appVersionsDetailsQuery?.data,
		selectedAppDistributionInfoData?.appVersionActionHash ?? ''
	)}
	<AppDetailsPanel
		imageUrl={createImageUrl(icon)}
		{appVersion}
		title={selectedApp.appInfo.installed_app_id}
		buttons={$appDetailsQuery
			? [$i18n.t('details'), capitalizeFirstLetter($i18n.t('settings'))]
			: [capitalizeFirstLetter($i18n.t('settings'))]}
		bind:selectedIndex
	>
		<div slot="topRight">
			{#if !selectedApp.isHeadless}
				{@const isDisabled =
					selectedApp.appInfo.status !== 'running' &&
					selectedApp.appInfo.status !== 'awaiting_memproofs' &&
					'disabled' in selectedApp.appInfo.status}
				<div class="flex h-full items-center justify-center">
					<SlideToggle
						on:click={() => {
							if (validateApp(selectedApp)) {
								$toggleApp.mutate({
									...selectedApp,
									enable: isDisabled
								});
							}
						}}
						checked={!isDisabled}
						active="bg-success-500"
						name="enabled-disabled-app-slider"
						size="lg"
					>
						{isDisabled ? $i18n.t('disabled') : $i18n.t('enabled')}
					</SlideToggle>
				</div>
			{/if}
		</div>
	</AppDetailsPanel>
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
	{#if selectedIndex === 0 && $appDetailsQuery && $appDetailsQuery.data}
		<div class="px-8 py-4">
			<p class="font-semibold">{$appDetailsQuery.data.content.subtitle}</p>
			<p>{$appDetailsQuery.data.content.description}</p>
		</div>
	{:else}
		<AppSettings
			isHeadless={selectedApp.isHeadless}
			uninstallLogic={() => showUninstallModal()}
			update={Boolean(update)}
		>
			{@const cellIds = Object.entries(selectedApp.appInfo.cell_info).sort(([a], [b]) =>
				a.localeCompare(b)
			)}
			<div class="mb-2 text-sm">
				<p class="break-all">
					<span class="font-semibold">network seed:</span>
					network seed here
				</p>
			</div>
			{#each cellIds as [roleName, cellId], index}
				{@const cellIdResult = getCellId(cellId[0])}
				{#if cellIdResult}
					<div class="mb-2 text-sm">
						<p class="break-all">
							<span class="font-semibold">{roleName}:</span>
							{encodeHashToBase64(cellIdResult[0])}
						</p>
						<p class="break-all">
							<span class="font-semibold">pubkey:</span>
							{encodeHashToBase64(cellIdResult[1])}
						</p>
					</div>
					{#if index !== cellIds.length - 1}
						<div class="!my-2 h-px w-full bg-tertiary-800"></div>
					{/if}
				{/if}
			{/each}
		</AppSettings>
	{/if}
{:else if $page.params.slug === KEY_MANAGEMENT}
	<KeyManagement />
{:else}
	<SystemSettings />
{/if}
