<script lang="ts">
	import TimeAgo from 'javascript-time-ago';

	import { Button } from '$components';
	import { markdownParseSafeTailwind } from '$helpers';
	import { i18n, trpc } from '$services';
	import { ProgressBar, getToastStore } from '@skeletonlabs/skeleton';

	const client = trpc();
	const toastStore = getToastStore();

	const launcherUpdateMutation = client.installLauncherUpdate.createMutation();
	const launcherUpdateAvailableQuery = client.launcherUpdateAvailable.createQuery();

	client.onLauncherUpdateDownloadProgress.createSubscription(undefined, {
		onData: (progressInfo) => {
			progressPercent = progressInfo.percent;
		}
	});

	const timeAgo = new TimeAgo('en-US');

	let progressPercent = 1;
	let installing = false;

	const installUpdate = () => {
		installing = true;
		$launcherUpdateMutation.mutate(undefined, {
			onError: (error) => {
				console.error(error);
				installing = false;
				toastStore.trigger({
					message: `Failed to upload new release: ${error.message}`,
					background: 'variant-filled-error'
				});
			}
		});
	};
</script>

<div class="flex flex-1 flex-col p-4">
	{#if $launcherUpdateAvailableQuery.isSuccess && $launcherUpdateAvailableQuery.data}
		<div
			class="drop-shadow-dark-xl m-5 rounded-md"
			style="padding: 2px; background: linear-gradient(#f9d402, #8b7600);"
		>
			<div class="bg-dark-background flex flex-col rounded pb-4 pl-4 pr-4 pt-2">
				<div class="flex flex-row items-center text-lg">
					<div class="text-gray-400">New verison available</div>
					<span class="flex flex-1"></span>
					<div class="text-gray-400">
						{timeAgo.format(new Date($launcherUpdateAvailableQuery.data.releaseDate))}
					</div>
				</div>
				<h1 class="h1">Holochain Launcher v{$launcherUpdateAvailableQuery.data.version}</h1>
				{#if $launcherUpdateAvailableQuery.data.releaseNotes}
					<div class="mt-2 text-lg text-gray-200">
						{@html markdownParseSafeTailwind($launcherUpdateAvailableQuery.data.releaseNotes)}
					</div>
				{/if}
				<div class="mt-4 flex flex-row">
					<span class="flex flex-1"></span>
					<span class="flex flex-1"></span>
					{#if !installing}
						<Button
							props={{
								disabled: installing,
								type: 'submit',
								class: 'btn-happ-button flex-1',
								onClick: installUpdate
							}}
						>
							<span>{$i18n.t('installAndRestart')}</span>
						</Button>
					{:else}
						<div class="flex flex-1 flex-col">
							<div class="mb-1">{$i18n.t('installing')}...</div>
							<ProgressBar value={progressPercent} max={100} meter="bg-amber-400" />
						</div>
					{/if}
				</div>
			</div>
		</div>
	{:else}
		<div>No updates.</div>
	{/if}
</div>
