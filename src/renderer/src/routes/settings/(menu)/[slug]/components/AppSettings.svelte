<script lang="ts">
	import clsx from 'clsx';

	import { Button } from '$components';
	import { i18n } from '$services';
	import DashedSection from '../../../components/DashedSection.svelte';
	import TrashCan from '$icons/TrashCan.svelte';

	export let uninstallLogic: () => void;
	export let update: boolean;
	export let isHeadless = false;
</script>

<div class={clsx(update && 'pt-0')}>
	{#if !isHeadless}
		<DashedSection containerClasses="m-2 p-2.5" title={$i18n.t('uninstallApp')}>
			<div class="flex-end flex flex-1 flex-row items-center">
				<span class="flex-1">{$i18n.t('uninstallAppAndRemoveAllData')}</span>
				<Button
					props={{
						class: 'btn-secondary flex-1 text-al max-w-28 !bg-error-500',
						onClick: uninstallLogic
					}}
				>
					<div class="flex flex-row items-center">
						<TrashCan color={'white'} />
						<span class="ml-1">{$i18n.t('uninstall')}</span>
					</div>
				</Button>
			</div>
		</DashedSection>
	{:else}
		<div class="p-4">
			No Settings available for this app.
		</div>
	{/if}
	<slot />
</div>
