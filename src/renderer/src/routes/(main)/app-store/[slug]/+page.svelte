<script lang="ts">
	import { encodeHashToBase64 } from '@holochain/client';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import type { AppVersionEntry, Entity } from 'appstore-tools';

	import { page } from '$app/stores';
	import { AppDetailsPanel, Button } from '$components';
	import {
		createImageUrl,
		getLatestVersion,
		showModalError,
		uint8ArrayToURIComponent
	} from '$helpers';
	import { InstallAppFromBytes } from '$modal';
	import InstallAppFromHashes from '$modal/InstallAppFromHashes.svelte';
	import { createAppQueries } from '$queries';
	import { i18n, trpc } from '$services';
	import { getErrorMessage } from '$shared/helpers';

	const client = trpc();

	const {
		appStoreHappsQuery,
		appVersionsAppstoreQueryFunction,
		fetchWebappBytesMutation,
		fetchUiBytesMutation
	} = createAppQueries();

	const utils = client.createUtils();
	const storeUiBytes = client.storeUiBytes.createMutation();

	const modalStore = getModalStore();

	const slug: string = $page.params.slug;
	let selectedIndex = 0;
	const app = $appStoreHappsQuery.data?.find(({ id }) => uint8ArrayToURIComponent(id) === slug);

	$: appVersionsDetailsQuery = appVersionsAppstoreQueryFunction(app?.id);

	const handleError = (error: unknown) => {
		modalStore.close();
		showModalError({
			modalStore,
			errorTitle: $i18n.t('appError'),
			errorMessage: getErrorMessage(error)
		});
	};

	const createModalInstallAppFromBytes =
		(versionEntity: Entity<AppVersionEntry>) => (bytes: Uint8Array) =>
			modalStore.trigger({
				type: 'component',
				component: {
					ref: InstallAppFromBytes,
					props: {
						bytes: bytes,
						appName: app?.title,
						appVersionActionHash: encodeHashToBase64(versionEntity.id),
						appEntryActionHash: encodeHashToBase64(versionEntity.content.for_app),
						appstoreDnaHash: encodeHashToBase64(versionEntity.content.apphub_hrl.dna)
					}
				}
			});

	const createModalInstallAppFromHashes = async (versionEntity: Entity<AppVersionEntry>) =>
		modalStore.trigger({
			type: 'component',
			component: {
				ref: InstallAppFromHashes,
				props: {
					uiZipSha256: versionEntity.content.bundle_hashes.ui_hash,
					happSha256: versionEntity.content.bundle_hashes.happ_hash,
					appName: app?.title,
					appVersionActionHash: encodeHashToBase64(versionEntity.id),
					appEntryActionHash: encodeHashToBase64(versionEntity.content.for_app),
					appstoreDnaHash: encodeHashToBase64(versionEntity.content.apphub_hrl.dna)
				}
			}
		});

	const fetchWebappBytesMutationLogic = (versionEntity: Entity<AppVersionEntry>) => {
		$fetchWebappBytesMutation.mutate(versionEntity.content, {
			onError: handleError,
			onSuccess: createModalInstallAppFromBytes(versionEntity)
		});
	};

	const fetchAndStoreUiBytesLogicAndInstall = (versionEntity: Entity<AppVersionEntry>) => {
		$fetchUiBytesMutation.mutate(versionEntity.content, {
			onSuccess: (bytes) =>
				$storeUiBytes.mutate(
					{ bytes },
					{
						onSuccess: () => createModalInstallAppFromHashes(versionEntity),
						onError: handleError
					}
				),
			onError: handleError
		});
	};

	const installLogic = async (versionEntity: Entity<AppVersionEntry>) => {
		const areUiBytesAvailable = await utils.areUiBytesAvailable.fetch(
			versionEntity.content.bundle_hashes.ui_hash
		);
		const areHashBytesAvailable = await utils.areUiBytesAvailable.fetch(
			versionEntity.content.bundle_hashes.happ_hash
		);
		console.log(areUiBytesAvailable, areHashBytesAvailable);
		if (areUiBytesAvailable && areHashBytesAvailable) {
			return createModalInstallAppFromHashes(versionEntity);
		}

		if (!areUiBytesAvailable && areHashBytesAvailable) {
			return fetchAndStoreUiBytesLogicAndInstall(versionEntity);
		}

		return fetchWebappBytesMutationLogic(versionEntity);
	};

	$: isLoading =
		$storeUiBytes.isPending ||
		$fetchUiBytesMutation.isPending ||
		$fetchWebappBytesMutation.isPending;
</script>

{#if app && appVersionsDetailsQuery && $appVersionsDetailsQuery?.isSuccess}
	{@const latestVersion = getLatestVersion($appVersionsDetailsQuery.data)}
	<AppDetailsPanel
		imageUrl={createImageUrl(app.icon)}
		title={app.title}
		appVersion={latestVersion?.content.version}
		subtitle={app.subtitle}
		buttons={[$i18n.t('description'), $i18n.t('versionHistory')]}
		bind:selectedIndex
	>
		<div slot="install">
			<Button
				props={{
					class: 'btn-app-store variant-filled',
					onClick: async () => {
						if (!latestVersion) {
							return handleError($i18n.t('appError'));
						}
						return installLogic(latestVersion);
					},
					isLoading
				}}
			>
				{$i18n.t('install')}
			</Button>
		</div>
	</AppDetailsPanel>
{/if}

{#if $appVersionsDetailsQuery?.data}
	{#if selectedIndex === 1}
		{#each $appVersionsDetailsQuery.data as versionEntry}
			<div class="flex w-full items-center justify-between px-8 pt-2">
				<h4 class="font-semibold">{versionEntry.content.version}</h4>
				<Button
					props={{
						class: 'btn-app-store variant-filled',
						isLoading,
						onClick: () => installLogic(versionEntry)
					}}
				>
					{$i18n.t('install')}
				</Button>
			</div>
		{/each}
	{/if}
{/if}
