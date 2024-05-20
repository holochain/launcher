<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';

	import { page } from '$app/stores';
	import { Button } from '$components';
	import { uint8ArrayToURIComponent } from '$helpers';
	import { Check } from '$icons';
	import { AddNewHappVersion } from '$modal';
	import { createAppQueries } from '$queries';
	import { i18n } from '$services';

	const { appVersionsAppstoreQueryFunction, appStoreMyHappsQuery } = createAppQueries();

	$: view = $page.params.slug;

	const modalStore = getModalStore();

	$: app = $appStoreMyHappsQuery?.data?.find((app) => uint8ArrayToURIComponent(app.id) === view);

	$: appVersionsQuery = appVersionsAppstoreQueryFunction(app?.id);
</script>

{#if $appVersionsQuery?.isSuccess && app}
	<div class="flex flex-col">
		{#if $appVersionsQuery.data.length > 0}
			<Button
				props={{
					type: 'reset',
					onClick: () => {
						if (app && app.apphubHrlTarget) {
							modalStore.trigger({
								type: 'component',
								component: {
									ref: AddNewHappVersion,
									props: {
										webappPackageId: app.apphubHrlTarget,
										appEntryId: app.id,
										previousVersions: $appVersionsQuery.data
									}
								}
							});
						}
					},
					class: 'btn-secondary'
				}}
			>
				{'+  ' + $i18n.t('addNewRelease')}
			</Button>
			{#each $appVersionsQuery.data as versionEntity}
				<div class="flex items-center pt-2">
					<Check />
					<h4 class="ml-2 font-semibold">{versionEntity.content.version}</h4>
				</div>
			{/each}
		{/if}
	</div>
{/if}
