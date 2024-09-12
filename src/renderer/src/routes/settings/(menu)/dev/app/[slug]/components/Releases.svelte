<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';
	import type { AppVersionEntry, Entity } from 'appstore-tools';
	import type { AppEntry } from 'appstore-tools/dist/appstore/types.js';

	import { Button } from '$components';
	import { Check } from '$icons';
	import { AddNewHappVersion } from '$modal';
	import { i18n } from '$services';

	const modalStore = getModalStore();

	export let appVersions: Entity<AppVersionEntry>[];
	export let app: Entity<AppEntry>;
</script>

<div class="flex flex-col px-8 py-6">
	{#if appVersions.length > 0}
		<Button
			props={{
				type: 'reset',
				onClick: () => {
					if (app && app.content.apphub_hrl.target) {
						modalStore.trigger({
							type: 'component',
							component: {
								ref: AddNewHappVersion,
								props: {
									webappPackageId: app.content.apphub_hrl.target,
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
