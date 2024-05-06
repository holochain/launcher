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
	import { createAppQueries } from '$queries';
	import { i18n } from '$services';

	const { appStoreHappsQuery, appVersionsAppstoreQueryFunction, fetchWebappBytesMutation } =
		createAppQueries();

	const modalStore = getModalStore();

	const slug: string = $page.params.slug;
	let selectedIndex = 0;
	const app = $appStoreHappsQuery.data?.find(({ id }) => uint8ArrayToURIComponent(id) === slug);

	$: appVersionsDetailsQuery = appVersionsAppstoreQueryFunction(app?.id);

	const fetchWebappBytesMutationLogic = (versionEntity: Entity<AppVersionEntry>) =>
		$fetchWebappBytesMutation.mutate(versionEntity.content, {
			onError: (error) => {
				console.error(error);
				showModalError({
					modalStore,
					errorTitle: $i18n.t('appError'),
					errorMessage: $i18n.t(error.message)
				});
			},
			onSuccess: (bytes) => {
				modalStore.trigger({
					type: 'component',
					component: {
						ref: InstallAppFromBytes,
						props: {
							bytes: bytes,
							appName: app?.title,
							appVersion: versionEntity.content.version,
							appVersionActionHash: encodeHashToBase64(versionEntity.id),
							appEntryActionHash: encodeHashToBase64(versionEntity.address),
							appstoreDnaHash: encodeHashToBase64(versionEntity.content.apphub_hrl.dna)
						}
					}
				});
			}
		});
</script>

{#if app && appVersionsDetailsQuery && $appVersionsDetailsQuery?.isSuccess}
	<AppDetailsPanel
		imageUrl={createImageUrl(app.icon)}
		title={app.title}
		subtitle={app.subtitle}
		buttons={[$i18n.t('description'), $i18n.t('versionHistory')]}
		bind:selectedIndex
	>
		<div slot="install">
			<Button
				props={{
					class: 'btn-app-store variant-filled',
					onClick: async () => {
						const appVersions = $appVersionsDetailsQuery.data;

						const latestVersion = getLatestVersion(appVersions);

						if (!latestVersion) {
							return showModalError({
								modalStore,
								errorTitle: $i18n.t('appError'),
								errorMessage: $i18n.t('appError')
							});
						}
						// check whether UI is already available

						// check whether happ is already available

						// if both available
						// installWebhappFromHashses(latestVersion.content.bundle_hashes,...)

						// if only happ available
						// fetchUiBytesMutation
						// storeUiBytes

						return fetchWebappBytesMutationLogic(latestVersion);
					},
					isLoading: $fetchWebappBytesMutation.isPending
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
						isLoading: $fetchWebappBytesMutation.isPending,
						onClick: () => fetchWebappBytesMutationLogic(versionEntry)
					}}
				>
					{$i18n.t('install')}
				</Button>
			</div>
		{/each}
	{/if}
{/if}
