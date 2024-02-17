<script lang="ts">
	import { getModalStore, ProgressRadial } from '@skeletonlabs/skeleton';

	import { Button, Input } from '$components';
	import { i18n } from '$services';
	import type { AppInstallFormData } from '$types';

	import InputModal from './InputModal.svelte';

	const modalStore = getModalStore();

	export let formData: AppInstallFormData;
	export let files: FileList | null = null;
	export let onSubmit: () => void;
	export let isPending = false;
	export let acceptFileType = false;
</script>

{#if $modalStore[0]}
	<div
		class="card w-modal flex flex-col items-center justify-center !bg-transparent !ring-transparent"
	>
		<slot name="avatar" />
		<header class="pt-4 text-2xl font-bold">
			{acceptFileType ? $i18n.t('installFromYourDevice') : $i18n.t('kando')}
		</header>
		<form class="modal-form flex flex-col space-y-4 p-4" on:submit|preventDefault={onSubmit}>
			{#if acceptFileType}
				<Input
					bind:files
					props={{
						type: 'file',
						id: 'appFile',
						accept: '.webhapp',
						class: `input-modal pl-2`
					}}
				/>
			{/if}
			<InputModal bind:value={formData.appId} id="appName" label={$i18n.t('name')} />
			<InputModal bind:value={formData.networkSeed} id="networkSeed" label={$i18n.t('network')} />
			<footer class="modal-footer flex justify-between gap-2">
				<Button
					props={{
						type: 'reset',
						onClick: modalStore.close,
						class: 'btn-app-store-modal-secondary flex-1',
						disabled: isPending
					}}
				>
					{$i18n.t('cancel')}
				</Button>
				<Button
					props={{
						disabled: formData.appId.length === 0 || isPending,
						type: 'submit',
						class: 'btn-app-store-modal flex-1'
					}}
				>
					{#if isPending}
						<span>{$i18n.t('installing')}</span><ProgressRadial stroke={100} width="w-6" />
					{:else}
						<span>{$i18n.t('install')}</span>
					{/if}
				</Button>
			</footer>
		</form>
	</div>
{/if}
