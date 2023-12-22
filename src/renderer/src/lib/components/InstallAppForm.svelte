<script lang="ts">
	import { Tab, TabGroup } from '@skeletonlabs/skeleton';

	import { i18n, trpc } from '$services';

	const client = trpc();

	let appId = '';
	let networkSeed = '';

	let tabsBasic = 0;
	let files: FileList;

	const DEFAULT_PARTITION = '0.2.x';

	const installedApps = client.getInstalledApps.createQuery();
	const installKandoMutation = client.installKando.createMutation();
	const installHappMutation = client.installHapp.createMutation();
</script>

<TabGroup class="col center-content mx-auto mb-2 max-w-xs space-y-2 text-center">
	<Tab bind:group={tabsBasic} name="installNewApp" value={0} class="button"
		>{$i18n.t('installNewApp')}</Tab
	>
	<Tab bind:group={tabsBasic} name="installKanDo" value={1} class="button mb-2"
		>{$i18n.t('installKanDo')}</Tab
	>
	<!-- Panel -->
	<svelte:fragment slot="panel">
		{#if tabsBasic === 0 || tabsBasic === 1}
			<form
				on:submit|preventDefault={() => {
					if (tabsBasic === 0) {
						return $installHappMutation.mutate(
							{
								partition: DEFAULT_PARTITION,
								appId,
								networkSeed,
								filePath: files[0].path
							},

							{
								onSuccess: () => {
									$installedApps.refetch();
									appId = '';
									networkSeed = '';
								}
							}
						);
					}
					return $installKandoMutation.mutate(
						{
							partition: DEFAULT_PARTITION,
							appId,
							networkSeed
						},
						{
							onSuccess: () => {
								$installedApps.refetch();
								appId = '';
								networkSeed = '';
							}
						}
					);
				}}
				class="column center-content space-y-4"
			>
				<h2 class="header mb-2">{$i18n.t('installNewApp')}</h2>
				<p class="mb-2">{tabsBasic === 0 ? $i18n.t('selectAppFromFilesystem') : ''}</p>
				{#if tabsBasic === 0}
					<input
						bind:files
						type="file"
						id="appFile"
						name="appFile"
						accept=".webhapp"
						class="input mb-2"
					/>
				{/if}

				<label for="appName" class="header mb-2">{$i18n.t('customAppName')}</label>
				<input
					id="appName"
					bind:value={appId}
					type="text"
					placeholder={$i18n.t('enterAppName')}
					required
					class="input mb-2"
				/>

				<label for="networkSeed" class="header mb-2">{$i18n.t('chooseNetworkSeed')}</label>
				<input
					id="networkSeed"
					bind:value={networkSeed}
					type="text"
					placeholder={$i18n.t('enterNetworkSeed')}
					class="input mb-2"
				/>

				<button type="submit" class="btn variant-filled mb-2"
					>{$i18n.t(tabsBasic === 0 ? 'installHapp' : 'installKanDo')}</button
				>
			</form>
		{/if}
	</svelte:fragment>
</TabGroup>
