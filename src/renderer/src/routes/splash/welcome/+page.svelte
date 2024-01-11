<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$components';
	import { i18n } from '$services';
</script>

<div class="pb-16">
	<h1 class="h1">{$i18n.t('holochainLauncher')}</h1>
	<h3 class="h3">{$i18n.t('discoverInstallAndManageYourApps')}</h3>
	<Button
		props={{
			onClick: () => goto('setup-lair')
		}}
	>
		{$i18n.t('getStarted')} →
	</Button>
</div>
