<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';

	import { Button } from '$components';
	import { i18n, trpc } from '$services';

	const modalStore = getModalStore();

	const client = trpc();

	const openLogs = client.openLogs.createMutation();
	const exportLogs = client.exportLogs.createMutation();

</script>

{#if $modalStore[0]}
	<div class="modal block overflow-y-auto bg-surface-100-800-token w-modal h-auto p-4 space-y-4 rounded-container-token shadow-xl">
		<header class="modal-header text-2xl font-bold">Startup Error</header>
		<article class="modal-body max-h-[200px] overflow-hidden">
			{$modalStore[0].body}
		</article>
		<footer class="modal-footer flex justify-end space-x-2">
			<Button
			props={{
				onClick: () => {
					// $modalStore[0]?.response?.(true);
					// modalStore.close();
					console.log("OPENING LOGS REQUESTED")
					$openLogs.mutate()
				},
				type: 'submit',
				class: 'btn variant-ghost-surface',
			}}
		>
			<span>{$i18n.t('openLogs')}</span>
		</Button>
			<Button
				props={{
					onClick: () => {
						// $modalStore[0]?.response?.(true);
						// modalStore.close();
						console.log("EXPORTING LOGS REQUESTED")
						$exportLogs.mutate()
					},
					type: 'submit',
					class: 'btn variant-ghost-surface',
				}}
			>
				<span>{$i18n.t('exportLogs')}</span>
			</Button>
			<Button
				props={{
					onClick: $modalStore[0]?.response?.(true) || modalStore.close,
					class: 'btn variant-ghost-surface'
				}}
			>
				{$i18n.t('cancel')}
			</Button>
		</footer>
	</div>
{/if}
