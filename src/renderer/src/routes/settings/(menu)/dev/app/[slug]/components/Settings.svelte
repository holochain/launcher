<script lang="ts">
	import { getToastStore } from '@skeletonlabs/skeleton';
	import type { AppEntry, Entity } from 'appstore-tools';

	import { Button } from '$components';
	import { createAppQueries } from '$queries';
	import { i18n } from '$services';

	import { DashedSection } from '../../../../../components';

	const { deprecateAppMutation, appStoreMyAppsQuery } = createAppQueries();

	const toastStore = getToastStore();

	export let app: Entity<AppEntry>;
</script>

<div class="px-2 py-4">
	<DashedSection containerClasses="m-2 p-2.5" title={$i18n.t('deprecateApp')}>
		<div class="flex flex-col justify-center">
			<div class="mb-2">{$i18n.t('deprecateAppExplanation')}</div>
			<div class="flex flex-row">
				<Button
					props={{
						onClick: () => {
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
						},
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
