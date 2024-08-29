<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$components';
	import { ArrowRight } from '$icons';
	import { i18n } from '$services';
</script>

<h1 class="h1">{$i18n.t('holochainLauncher')}</h1>
<h4 class="h4 font-semibold mb-8">{$i18n.t('discoverInstallAndManageYourApps')}</h4>
<Button
	props={{
		onClick: () => goto('quick-setup-step-1'),
		style: 'min-width: 190px; margin-bottom: 15px;'
	}}
>
	{$i18n.t('quickSetup')}
	<ArrowRight />
</Button>
<Button
	props={{
		onClick: () => {
			window.resizeTo(800,700);
			window.moveBy(-100, -70);
			goto('advanced-setup-step-1')
		},
		class: 'btn-black',
		style: 'min-width: 190px;'
	}}
>
	{$i18n.t('advancedSetup')}
	<ArrowRight />
</Button>
