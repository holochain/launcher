<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$components';
	import { i18n } from '$services';
</script>

<div class="pb-16">
	<h1 class="text-4xl font-semibold">{$i18n.t('holochainLauncher')}</h1>
	<p class="pb-8 text-base">{$i18n.t('discoverInstallAndManageYourApps')}</p>
	<Button
		props={{
			onClick: () => goto('setup-lair')
		}}
	>
		{$i18n.t('getStarted')} →
	</Button>
</div>
