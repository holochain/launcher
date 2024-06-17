<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';

	import { Button } from '$components';
	import { Confirmation } from '$icons';
	import { i18n } from '$services';

	const modalStore = getModalStore();
</script>

{#if $modalStore[0]}
	<div class="flex flex-col items-center gap-4 !bg-modal-background p-4">
		<div class="pb-2">
			<Confirmation />
		</div>
		<p class="mb-4 max-w-72 p-4 text-center leading-tight text-warning-500">
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
						$modalStore[0]?.response?.(true);
						modalStore.close();
					},
					type: 'submit',
					class: 'btn-secondary bg-add-happ-button flex-1'
				}}
			>
				<span>{$i18n.t('continue')}</span>
			</Button>
		</div>
	</div>
{/if}
