<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$components';
	import { ArrowRight } from '$icons';
	import { i18n } from '$services';

	import TitleSubtitle from '../components/TitleSubtitle.svelte';
</script>

<TitleSubtitle
	title={$i18n.t('holochainLauncher')}
	subtitle={$i18n.t('discoverInstallAndManageYourApps')}
/>
<Button
	props={{
		onClick: () => goto('setup-password')
	}}
>
	{$i18n.t('getStarted')}
	<ArrowRight />
</Button>
