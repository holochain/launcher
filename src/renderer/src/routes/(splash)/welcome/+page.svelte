<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$components';
	import { ArrowRight } from '$icons';
	import { i18n } from '$services';
</script>

<h1 class="h1">{$i18n.t('holochainLauncher')}</h1>
<h4 class="h4">{$i18n.t('discoverInstallAndManageYourApps')}</h4>
<Button
	props={{
		onClick: () => goto('setup-password')
	}}
>
	{$i18n.t('getStarted')}
	<ArrowRight />
</Button>
