<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';

	import { Button } from '$components';
	import { i18n } from '$services';

	const modalStore = getModalStore();
</script>

{#if $modalStore[0]}
	<div class="flex flex-col items-center gap-4 rounded-lg bg-modal-background p-8">
		<p class="mb-4 max-w-72 text-center leading-tight">
			{$i18n.t('factoryResetModalBody')}
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
					class: 'btn-secondary !bg-error-500 flex-1 text-al'
				}}
			>
				<span>{$i18n.t('factoryResetConfirm')}</span>
			</Button>
		</div>
	</div>
{/if}
