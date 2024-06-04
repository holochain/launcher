<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';
	import type { AppVersionEntry, Entity } from 'appstore-tools';

	import { Button } from '$components';
	import { Check } from '$icons';
	import { AddNewHappVersion } from '$modal';
	import { i18n } from '$services';
	import type { AppWithIcon } from '$types';

	const modalStore = getModalStore();

	export let appVersions: Entity<AppVersionEntry>[];
	export let app: AppWithIcon;
</script>

<div class="flex flex-col">
	{#if appVersions.length > 0}
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
									previousVersions: appVersions
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
		{#each appVersions as versionEntity}
			<div class="flex items-center pt-2">
				<Check />
				<h4 class="ml-2 font-semibold">{versionEntity.content.version}</h4>
			</div>
		{/each}
	{/if}
</div>
