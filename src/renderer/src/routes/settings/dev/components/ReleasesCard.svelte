<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';

	import { Button } from '$components';
	// import { Check } from '$icons';
	import AddNewHappVersion from '$modal/AddNewHappVersion.svelte';
	import { createAppQueries } from '$queries';
	import { i18n } from '$services';

	export let id: Uint8Array;

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
			<Button
				props={{
					type: 'reset',
					onClick: () =>
						modalStore.trigger({
							type: 'component',
							component: {
								ref: AddNewHappVersion,
								props: { webappPackageId: '1' }
							}
						}),
					class: 'btn-secondary mx-4'
				}}
			>
				{'+  ' + $i18n.t('addNewRelease')}
			</Button>
			<!-- {#each $appVersionsQuery.data.versions as { version }
				<div class="flex items-center pt-2">
					<Check />
					<h4 class="ml-2 font-semibold">{version}</h4>
				</div>
			{/each} -->
		</div>
	</div>
{/if}
