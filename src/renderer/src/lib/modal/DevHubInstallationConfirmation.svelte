<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';

	import { Button } from '$components';
	import { showModalError } from '$helpers';
	import { Confirmation } from '$icons';
	import { createDevHubClient, i18n, trpc } from '$services';

	const client = trpc();

	const modalStore = getModalStore();

	const installDevhub = client.installDevhub.createMutation();
	const isDevhubInstalled = client.isDevhubInstalled.createQuery();
</script>

{#if $modalStore[0]}
	<div class="flex flex-col items-center gap-4">
		<div class="pb-2">
			<Confirmation />
		</div>
		<p class="mb-4 max-w-72 text-center leading-tight text-warning-500">
			{$i18n.t('theDeveloperToolkitSyncs')}
		</p>
		<div class="flex w-full gap-4">
			<Button
				props={{
					onClick: modalStore.close,
					class: 'btn-secondary flex-1'
				}}
			>
				{$i18n.t('cancel')}
			</Button>
			<Button
				props={{
					onClick: () => {
						$installDevhub.mutate(undefined, {
							onSuccess: async (appPort) => {
								if (!appPort) {
									modalStore.close();
									showModalError({
										modalStore,
										errorTitle: $i18n.t('appError'),
										errorMessage: $i18n.t('noAppPortProvidedError')
									});
									return;
								}

								await createDevHubClient(appPort);
								$isDevhubInstalled.refetch();
								modalStore.close();
							}
						});
					},
					isLoading: $installDevhub.isPending,
					type: 'submit',
					class: 'btn-secondary bg-add-happ-button flex-1'
				}}
			>
				<span>{$i18n.t('continue')}</span>
			</Button>
		</div>
	</div>
{/if}
