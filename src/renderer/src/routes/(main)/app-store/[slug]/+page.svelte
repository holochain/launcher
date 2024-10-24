<script lang="ts">
	import { encodeHashToBase64 } from '@holochain/client';
	import { Avatar, getModalStore, getToastStore } from '@skeletonlabs/skeleton';
	import type { AppVersionEntry, Entity } from 'appstore-tools';

	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { AppDetailsPanel, CenterProgressRadial } from '$components';
	import { PRESEARCH_URL_QUERY } from '$const';
	import {
		capitalizeFirstLetter,
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

	const { appStoreAllAppsQuery, appVersionsAppstoreQueryFunction, getPublisherQueryFunction } =
		createAppQueries();

	const fetchWebapp = client.fetchWebhapp.createMutation();
	const installedApps = client.getInstalledApps.createQuery();
	const installWebhappFromHashes = client.installWebhappFromHashes.createMutation();
	client.onDownloadProgressUpdate.createSubscription(undefined, {
		onData: (data) => {
			loadingString = data;
		}
	});

	const modalStore = getModalStore();
	const toastStore = getToastStore();

	console.log('RENDERING APP DETAIL CARD IN APPSTORE');

	const slug: string = $page.params.slug;
	let selectedIndex = 0;
	let loadingString = '';
	const app = $appStoreAllAppsQuery.data?.find(({ id }) => uint8ArrayToURIComponent(id) === slug);

	$: appVersionsDetailsQuery = appVersionsAppstoreQueryFunction(app?.id);

	$: getPublisherQuery = getPublisherQueryFunction(app?.content.publisher);

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
			errorTitle: $i18n.t('downloadError'),
			errorMessage: $i18n.t(errorMessage)
		});
	};

	const createModalInstallAppFromHashes = async (versionEntity: Entity<AppVersionEntry>) => {
		modalStore.trigger({
			type: 'component',
			component: {
				ref: InstallAppFromHashes,
				props: {
					icon: app?.content.icon,
					appName: app?.content.title
				}
			},
			response: (r) => {
				if (!r || r === true) {
					return;
				}
				const { appId, networkSeed } = r;
				if (appId.length === 0) {
					return;
				}
				$installWebhappFromHashes.mutate(
					{
						uiZipSha256: versionEntity.content.bundle_hashes.ui_hash,
						happSha256: versionEntity.content.bundle_hashes.happ_hash,
						distributionInfo: {
							type: DISTRIBUTION_TYPE_APPSTORE,
							appName: app?.content.title ?? '',
							appstoreDnaHash: encodeHashToBase64(versionEntity.content.apphub_hrl.dna),
							appEntryActionHash: encodeHashToBase64(versionEntity.content.for_app),
							appVersionActionHash: encodeHashToBase64(versionEntity.id)
						},
						appId: appId,
						networkSeed: networkSeed
					},
					{
						onSuccess: () => {
							modalStore.close();
							$installedApps.refetch();
							toastStore.trigger({
								message: `${appId} ${$i18n.t('installedSuccessfully')}`
							});
							goto(`/${APPS_VIEW}?${PRESEARCH_URL_QUERY}=${appId}`);
						},
						onError: (error) => {
							console.error(error);
							const errorMessage = getErrorMessage(error);
							toastStore.trigger({
								message: $i18n.t(errorMessage),
								background: 'variant-filled-error'
							});
						}
					}
				);
			}
		});
	};

	const installLogic = async (versionEntity: Entity<AppVersionEntry>) => {
		loadingString = 'connectingToPeers';

		$fetchWebapp.mutate(
			{ app_version: versionEntity.content, icon: app?.content.icon },
			{
				onSuccess: () => {
					loadingString = '';
					createModalInstallAppFromHashes(versionEntity);
				},
				onError: (error) => {
					loadingString = '';
					handleError(error, versionEntity);
				}
			}
		);
	};

	$: isLoading = $fetchWebapp.isPending || $installWebhappFromHashes.isPending;
</script>

{#if app && appVersionsDetailsQuery && $appVersionsDetailsQuery?.isSuccess}
	{@const latestVersion = getLatestVersion($appVersionsDetailsQuery.data)}
	<AppDetailsPanel
		imageUrl={createImageUrl(app.content.icon)}
		title={app.content.title}
		id={app.id}
		appVersion={latestVersion?.content.version}
		subtitle={app.content.subtitle}
		buttons={[
			$i18n.t('description'),
			$i18n.t('versionHistory'),
			capitalizeFirstLetter($i18n.t('publisher'))
		]}
		publisher={$getPublisherQuery?.data?.content.name}
		bind:selectedIndex
	>
		<div slot="topRight" class="flex flex-1">
			<span class="flex-1"></span>
			<div class="flex flex-col justify-center">
				<InstallButton
					disabled={isLoading}
					{loadingString}
					onClick={async () =>
						latestVersion ? installLogic(latestVersion) : handleError($i18n.t('appError'))}
				>
					<span class="min-w-28 text-base">{$i18n.t('install')}</span>
				</InstallButton>
			</div>
		</div>
	</AppDetailsPanel>
{/if}

{#if $appVersionsDetailsQuery?.data}
	{#if app && selectedIndex === 0}
		<div class="p-6 px-8">
			{app.content.description}
		</div>
	{:else if selectedIndex === 1}
		<div class="pt-2">
			{#each $appVersionsDetailsQuery.data as versionEntry}
				<VersionEntry
					version={versionEntry.content.version}
					installLogic={() => installLogic(versionEntry)}
					{isLoading}
				/>
			{/each}
		</div>
	{:else if selectedIndex === 2}
		{#if app && getPublisherQuery && $getPublisherQuery?.isSuccess}
			<div class="flex flex-col p-6">
				<div class="flex flex-row items-center">
					<Avatar src={createImageUrl($getPublisherQuery.data.content.icon)} width="w-20"></Avatar>
					<span class="ml-5 text-xl font-semibold text-white/80"
						>{$getPublisherQuery.data.content.name}</span
					>
				</div>
				<div class="mt-5 flex-row text-lg">
					<span class="font-semibold">{$i18n.t('location')}:</span>
					<span class="ml-3 text-white/60">{$getPublisherQuery.data.content.location}</span>
				</div>
				<div class="flex-row text-lg">
					<span class="font-semibold">{$i18n.t('website')}:</span>
					<span class="ml-3 text-white/60 underline hover:text-white"
						><a href={$getPublisherQuery.data.content.website.url}
							>{$getPublisherQuery.data.content.website.url}</a
						></span
					>
				</div>
			</div>
		{:else if $getPublisherQuery?.error}
			{$getPublisherQuery?.error}
		{:else if $getPublisherQuery?.isPending}
			<CenterProgressRadial width="w-12" />
		{/if}
	{/if}
{/if}
