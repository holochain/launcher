<script lang="ts">
	import clsx from 'clsx';

	import { Button } from '$components';
	import { i18n } from '$services';
	import DashedSection from '../../../components/DashedSection.svelte';

	export let uninstallLogic: () => void;
	export let update: boolean;
	export let isHeadless = false;
</script>

<div class={clsx(update && 'pt-0')}>
	{#if !isHeadless}
		<DashedSection title={$i18n.t('uninstallApp')}>
			<div class="flex flex-row flex-end flex-1">
				<span class="flex-1"></span>
				<Button
					props={{
						class: 'btn-secondary flex-1 text-al max-w-28',
						onClick: uninstallLogic
					}}
				>
					{$i18n.t('uninstall')}
				</Button>
			</div>

		</DashedSection>
	{/if}
	<slot />
</div>
