<script lang="ts">
	import { Button } from '$components';
	import { i18n } from '$services';

	export let version: string;
	export let isLoading: boolean;
	export let installLogic: () => void;
</script>

<div class="flex w-full items-center justify-between px-8 pt-2">
	<h4 class="font-semibold">{version}</h4>
	<Button
		props={{
			class: 'btn-app-store variant-filled',
			isLoading,
			onClick: installLogic
		}}
	>
		{$i18n.t('install')}
	</Button>
</div>
