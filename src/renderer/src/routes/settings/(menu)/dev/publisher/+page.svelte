<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$components';
	import { PUBLISHER_SCREEN } from '$const';
	import { Publisher } from '$icons';
	import { i18n } from '$services';
</script>

<Publisher />
<h2 class="h2 pt-2">{$i18n.t('publishingDashboard')}</h2>
<p class="mb-4 max-w-sm text-center font-[400]">
	{$i18n.t('welcomeToTheHolochainLauncherDeveloperDashboard')}
</p>
<Button
	props={{
		type: 'button',
		onClick: () => goto(`/${PUBLISHER_SCREEN}/add`),
		class: 'btn-happ-button mt-4'
	}}
>
	<span>{$i18n.t('setUpYourPublisherProfile')}</span>
</Button>
