<script lang="ts">
	import { encodeHashToBase64 } from '@holochain/client';
	import { getModalStore, getToastStore } from '@skeletonlabs/skeleton';
	import type { AppVersionEntry, Entity } from 'appstore-tools';

	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { AppDetailsPanel } from '$components';
	import { PRESEARCH_URL_QUERY } from '$const';
	import {
		createImageUrl,
		getLatestVersion,
		showModalError,
		uint8ArrayToURIComponent
	} from '$helpers';
	import { InstallAppFromHashes } from '$modal';
	import { createAppQueries } from '$queries';
	import { i18n, trpc } from '$services';
	import { APPS_VIEW, DISTRIBUTION_TYPE_APPSTORE } from '$shared/const';
	import { getErrorMessage } from '$shared/helpers';
	import { APP_NAME_EXISTS_ERROR } from '$shared/types';

	import InstallButton from './components/InstallButton.svelte';
	import VersionEntry from './components/VersionEntry.svelte';

	const client = trpc();

	const { appStoreHappsQuery, appVersionsAppstoreQueryFunction } = createAppQueries();

	const fetchWebapp = client.fetchWebhapp.createMutation();
	const installedApps = client.getInstalledApps.createQuery();
	const installWebhappFromHashes = client.installWebhappFromHashes.createMutation();

	const modalStore = getModalStore();
	const toastStore = getToastStore();

	const slug: string = $page.params.slug;
	let selectedIndex = 0;
	let loadingString = '';
	const app = $appStoreHappsQuery.data?.find(({ id }) => uint8ArrayToURIComponent(id) === slug);

	$: appVersionsDetailsQuery = appVersionsAppstoreQueryFunction(app?.id);

	const handleError = (error: unknown, versionEntity?: Entity<AppVersionEntry>) => {
		console.error(error);
		loadingString = '';
		const errorMessage = getErrorMessage(error);
		if (errorMessage === APP_NAME_EXISTS_ERROR && versionEntity) {
			toastStore.trigger({
				message: $i18n.t(errorMessage)
			});
			return installLogic(versionEntity);
		}
		return showModalError({
			modalStore,
			errorTitle: $i18n.t('appError'),
			errorMessage: $i18n.t(errorMessage)
		});
	};

	const createModalInstallAppFromHashes = async (versionEntity: Entity<AppVersionEntry>) => {
		modalStore.trigger({
			type: 'component',
			component: {
				ref: InstallAppFromHashes,
				props: {
					icon: app?.icon,
					appName: app?.title
				}
			},
			response: ({ appId, networkSeed }: { appId: string; networkSeed: string }) => {
				modalStore.close();
				if (appId.length === 0) {
					return;
				}
				loadingString = 'installingApp';
				$installWebhappFromHashes.mutate(
					{
						uiZipSha256: versionEntity.content.bundle_hashes.ui_hash,
						happSha256: versionEntity.content.bundle_hashes.happ_hash,
						distributionInfo: {
							type: DISTRIBUTION_TYPE_APPSTORE,
							appName: app?.title ?? '',
							appstoreDnaHash: encodeHashToBase64(versionEntity.content.apphub_hrl.dna),
							appEntryActionHash: encodeHashToBase64(versionEntity.content.for_app),
							appVersionActionHash: encodeHashToBase64(versionEntity.id)
						},
						appId: appId,
						networkSeed: networkSeed
					},
					{
						onSuccess: () => {
							$installedApps.refetch();
							toastStore.trigger({
								message: `${appId} ${$i18n.t('installedSuccessfully')}`
							});
							goto(`/${APPS_VIEW}?${PRESEARCH_URL_QUERY}=${appId}`);
						},
						onError: (error) => handleError(error, versionEntity)
					}
				);
			}
		});
	};
	const clearTimeoutAndHandle = (
		timeout: ReturnType<typeof setTimeout> | null,
		callback: () => void
	) => {
		if (timeout) {
			clearTimeout(timeout);
			loadingString = '';
		}
		callback();
	};

	const installLogic = async (versionEntity: Entity<AppVersionEntry>) => {
		loadingString = 'connectingToPeers';
		const gettingAppBytesTimeout = setTimeout(() => (loadingString = 'gettingAppBytes'), 2000);

		$fetchWebapp.mutate(
			{ app_version: versionEntity.content, icon: app?.icon },
			{
				onSuccess: () =>
					clearTimeoutAndHandle(gettingAppBytesTimeout, () =>
						createModalInstallAppFromHashes(versionEntity)
					),
				onError: (error) =>
					clearTimeoutAndHandle(gettingAppBytesTimeout, () => handleError(error, versionEntity))
			}
		);
	};

	$: isLoading = $fetchWebapp.isPending || $installWebhappFromHashes.isPending;
</script>

{#if app && appVersionsDetailsQuery && $appVersionsDetailsQuery?.isSuccess}
	{@const latestVersion = getLatestVersion($appVersionsDetailsQuery.data)}
	<AppDetailsPanel
		imageUrl={createImageUrl(app.icon)}
		title={app.title}
		id={app.id}
		appVersion={latestVersion?.content.version}
		subtitle={app.subtitle}
		buttons={[$i18n.t('description'), $i18n.t('versionHistory')]}
		bind:selectedIndex
	>
		<div slot="topRight">
			<InstallButton
				disabled={isLoading}
				{loadingString}
				onClick={async () =>
					latestVersion ? installLogic(latestVersion) : handleError($i18n.t('appError'))}
			>
				{$i18n.t('install')}
			</InstallButton>
		</div>
	</AppDetailsPanel>
{/if}

{#if $appVersionsDetailsQuery?.data}
	{#if app && selectedIndex === 0}
		<div class="px-8 py-2">
			{app.description}
		</div>
	{:else if selectedIndex === 1}
		{#each $appVersionsDetailsQuery.data as versionEntry}
			<VersionEntry
				version={versionEntry.content.version}
				installLogic={() => installLogic(versionEntry)}
				{isLoading}
			/>
		{/each}
	{/if}
{/if}
