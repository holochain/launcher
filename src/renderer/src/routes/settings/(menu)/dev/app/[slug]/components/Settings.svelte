<script lang="ts">
	import { Button } from '$components';
	import { i18n } from '$services';

	import { DashedSection } from '../../../../../components';
</script>

<div class="px-2 py-4">
	<DashedSection containerClasses="m-2 p-2.5" title={$i18n.t('deprecateApp')}>
		<div class="flex flex-col justify-center">
			<div class="mb-2">{$i18n.t('deprecateAppExplanation')}</div>
			<div class="flex flex-row">
				<Button
					props={{
						class: 'btn-install !bg-error-500'
					}}
				>
					{$i18n.t('deprecateApp')}
				</Button>
				<span class="flex flex-1"></span>
			</div>
		</div>
	</DashedSection>
</div>
