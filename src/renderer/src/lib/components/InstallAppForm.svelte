<script lang="ts">
	import { Tab, TabGroup } from '@skeletonlabs/skeleton';

	import { Button, Input } from '$components';
	import { i18n, trpc } from '$services';

	const client = trpc();

	let appId = '';
	let networkSeed = '';

	let tabsBasic = 0;
	let files: FileList;

	const installedApps = client.getInstalledApps.createQuery();
	const installKandoMutation = client.installKando.createMutation();
	const installHappMutation = client.installHapp.createMutation();
</script>

<TabGroup class="center-content mx-auto mb-2 max-w-xs space-y-2 text-center">
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
					<Input bind:files props={{ type: 'file', id: 'appFile', accept: '.webhapp' }} />
				{/if}

				<label for="appName" class="header mb-2">{$i18n.t('customAppName')}</label>
				<Input
					bind:value={appId}
					props={{
						id: 'appName',
						type: 'text',
						placeholder: $i18n.t('enterAppName'),
						required: true
					}}
				/>

				<label for="networkSeed" class="header mb-2">{$i18n.t('chooseNetworkSeed')}</label>
				<Input
					bind:value={networkSeed}
					props={{
						id: 'networkSeed',
						type: 'text',
						placeholder: $i18n.t('enterNetworkSeed')
					}}
				/>
				<Button
					props={{
						type: 'submit'
					}}
				>
					{$i18n.t(tabsBasic === 0 ? 'installHapp' : 'installKanDo')}
				</Button>
			</form>
		{/if}
	</svelte:fragment>
</TabGroup>
