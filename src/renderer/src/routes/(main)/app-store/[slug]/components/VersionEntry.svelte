<script lang="ts">
	import { i18n } from '$services';

	import InstallButton from './InstallButton.svelte';

	export let version: string;
	export let isLoading: boolean;
	export let installLogic: () => void;
</script>

<div class="flex w-full items-center justify-between px-8 pt-2">
	<h4 class="font-semibold">{version}</h4>
	<InstallButton disabled={isLoading} onClick={installLogic}>
		{$i18n.t('install')}
	</InstallButton>
</div>
