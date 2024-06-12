<script lang="ts">
	import clsx from 'clsx';

	import { Button } from '$components';
	import { i18n } from '$services';

	export let uninstallLogic: () => void;
	export let update: boolean;
	export let isHeadless = false;
</script>

<div class={clsx('p-8', update && 'pt-0')}>
	{#if !isHeadless}
		<div class="flex items-center justify-between">
			<Button
				props={{
					class: 'btn-app-store variant-filled',
					onClick: uninstallLogic
				}}
			>
				{$i18n.t('uninstall')}
			</Button>
		</div>
	{/if}
	<slot />
</div>
