<script lang="ts">
	import { getModalStore, getToastStore } from '@skeletonlabs/skeleton';
	import type { AppEntry, Entity } from 'appstore-tools';

	import { Button } from '$components';
	import { MODAL_DEPRECATE_APP_CONFIRMATION } from '$const';
	import { createModalParams } from '$helpers';
	import { createAppQueries } from '$queries';
	import { i18n } from '$services';
	import type { Modals } from '$types';

	import { DashedSection } from '../../../../../components';

	const { deprecateAppMutation, appStoreMyAppsQuery } = createAppQueries();

	const modalStore = getModalStore();
	const toastStore = getToastStore();

	export let app: Entity<AppEntry>;

	const showModal = (modalType: Modals, response?: (r: unknown) => void) => {
		const modal = createModalParams(modalType, response);
		modalStore.trigger(modal);
	};

	const showDeprecateAppModal = () => {
		showModal(MODAL_DEPRECATE_APP_CONFIRMATION, (confirm) => {
			if (confirm) {
				$deprecateAppMutation.mutate(
					{
						base: app.action,
						message: ''
					},
					{
						onSuccess: () => {
							toastStore.trigger({
								message: $i18n.t('appDeprecated')
							});
							$appStoreMyAppsQuery.refetch();
						},
						onError: (error) => {
							console.error(error);
							toastStore.trigger({
								message: `Failed to deprecate app: ${$i18n.t(error.message)}`,
								background: 'variant-filled-error'
							});
						}
					}
				);
			}
		});
	};
</script>

<div class="px-2 py-4">
	<DashedSection containerClasses="m-2 p-2.5" title={$i18n.t('deprecateApp')}>
		<div class="flex flex-col justify-center">
			<div class="mb-2">{$i18n.t('deprecateAppExplanation')}</div>
			<div class="flex flex-row">
				<Button
					props={{
						onClick: showDeprecateAppModal,
						class: 'btn-install !bg-error-500',
						disabled: !!app.content.deprecation || $deprecateAppMutation.isPending,
						isLoading: $deprecateAppMutation.isPending
					}}
				>
					{$i18n.t('deprecateApp')}
				</Button>
				<span class="flex flex-1"></span>
			</div>
		</div>
	</DashedSection>
</div>
