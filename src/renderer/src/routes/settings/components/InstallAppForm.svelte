<script lang="ts">
	import { Button, Input } from '$components';
	import { i18n, trpc } from '$services';

	const client = trpc();

	let appId = '';
	let networkSeed = '';

	let files: FileList;

	const installedApps = client.getInstalledApps.createQuery();
	const installHappMutation = client.installHapp.createMutation();
</script>

<form
	on:submit|preventDefault={() =>
		$installHappMutation.mutate(
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
		)}
	class="my-4 flex max-w-md flex-col items-center space-y-4 self-center"
>
	<h2 class="h2 mb-2">{$i18n.t('installNewApp')}</h2>
	<p class="mb-2">{$i18n.t('selectAppFromFilesystem')}</p>

	<Input bind:files props={{ type: 'file', id: 'appFile', accept: '.webhapp' }} />

	<label for="appName" class="header mb-2">{$i18n.t('name')}</label>
	<Input
		bind:value={appId}
		props={{
			id: 'appName',
			type: 'text',
			placeholder: $i18n.t('enterAppName'),
			required: true
		}}
	/>

	<label for="networkSeed" class="header mb-2">{$i18n.t('network')}</label>
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
			disabled: appId.length === 0 || files.length > 0,
			type: 'submit'
		}}
	>
		{$i18n.t('installHapp')}
	</Button>
</form>
