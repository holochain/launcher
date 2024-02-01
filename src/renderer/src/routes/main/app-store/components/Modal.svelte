<script lang="ts">
	import { Avatar, getModalStore, ProgressRadial } from '@skeletonlabs/skeleton';

	import { goto } from '$app/navigation';
	import { Button } from '$components';
	import { i18n, trpc } from '$services';

	import InputModal from './InputModal.svelte';

	const client = trpc();

	const modalStore = getModalStore();

	const formData = {
		appId: '',
		networkSeed: ''
	};

	const installedApps = client.getInstalledApps.createQuery();
	const installKandoMutation = client.installKando.createMutation();
</script>

{#if $modalStore[0]}
	<div
		class="card w-modal flex flex-col items-center justify-center !bg-transparent !ring-transparent"
	>
		<Avatar initials={'kn'} rounded="rounded-2xl" background="bg-app-gradient" width="w-20" />
		<header class="pt-4 text-2xl font-bold">{$modalStore[0].title ?? $i18n.t('kando')}</header>
		<form
			on:submit|preventDefault={() =>
				$installKandoMutation.mutate(
					{
						appId: formData.appId,
						networkSeed: formData.networkSeed
					},
					{
						onSuccess: () => {
							$installedApps.refetch();
							goto(`apps-view?presearch=${formData.appId}`);
							modalStore.close();
						}
					}
				)}
			class="modal-form flex flex-col space-y-4 p-4"
		>
			<InputModal bind:value={formData.appId} id="appName" label={$i18n.t('name')} />
			<InputModal bind:value={formData.networkSeed} id="networkSeed" label={$i18n.t('network')} />
			<footer class="modal-footer flex justify-between gap-2">
				{#if !$installKandoMutation.isPending}
					<Button
						props={{
							type: 'reset',
							onClick: modalStore.close,
							class: 'btn-app-store-modal-secondary flex-1'
						}}
					>
						<span class="opacity-50">
							{$i18n.t('cancel')}
						</span>
					</Button>
				{/if}
				<Button
					props={{
						disabled: formData.appId.length === 0 || $installKandoMutation.isPending,
						type: 'submit',
						class: 'btn-app-store-modal flex-1'
					}}
				>
					{#if $installKandoMutation.isPending}
						<span>{$i18n.t('installing')}</span><ProgressRadial stroke={100} width="w-6" />
					{:else}
						{$i18n.t('install')}
					{/if}
				</Button>
			</footer>
		</form>
	</div>
{/if}
