<script lang="ts">
	import type { ActionHash } from '@holochain/client';
	import { getModalStore } from '@skeletonlabs/skeleton';

	import { Button } from '$components';
	import { Check } from '$icons';
	import { AddNewHappVersion } from '$modal';
	import { createAppQueries } from '$queries';
	import { i18n } from '$services';

	export let id: Uint8Array;
	export let apphubHrlTarget: ActionHash;

	const { appVersionsAppstoreQueryFunction } = createAppQueries();

	const modalStore = getModalStore();

	$: appVersionsQuery = appVersionsAppstoreQueryFunction(id);
</script>

{#if $appVersionsQuery.isSuccess}
	<div class="mt-8">
		<div class="relative">
			<div class="absolute -top-10 inline-block rounded-sm bg-surface-800 p-4">
				{$i18n.t('releases')}
			</div>
		</div>
		<div class="card flex flex-col p-4">
			{#if $appVersionsQuery.data.length > 0}
				<Button
					props={{
						type: 'reset',
						onClick: () => {
							if (apphubHrlTarget) {
								modalStore.trigger({
									type: 'component',
									component: {
										ref: AddNewHappVersion,
										props: { webappPackageId: apphubHrlTarget }
									}
								});
							}
						},
						class: 'btn-secondary mx-4'
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
	</div>
{/if}
