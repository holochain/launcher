<script lang="ts">
	import { i18n } from '$services';

	import Button from './Button.svelte';

	export let isPending: boolean;
	export let isValid: boolean;
	export let onCancel: () => void;
</script>

<footer class="flex justify-between gap-2">
	<Button
		props={{
			type: 'reset',
			onClick: onCancel,
			class: 'btn-app-store-modal-secondary flex-1'
		}}
	>
		{$i18n.t('cancel')}
	</Button>
	<Button
		props={{
			disabled: isPending || !isValid,
			isLoading: isPending,
			type: 'submit',
			class: 'btn-app-store-modal flex-1'
		}}
	>
		<span>{$i18n.t('add')}</span>
	</Button>
</footer>
