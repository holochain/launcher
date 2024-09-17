<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button, IconButton } from '$components';
	import { ArrowRight, BackArrow } from '$icons';
	import { i18n } from '$services';
	import { appPassword } from '$stores';

	const keystoreInitialized = window.sessionStorage.getItem('keystoreInitialized');
</script>

<div
	class="app-region-drag fixed left-0 right-0 top-0 flex items-center justify-between bg-[#DADADA12] p-3"
>
	<div class="relative flex w-full items-center justify-center py-[11px]">
		{#if !keystoreInitialized}
			<IconButton
				buttonClass="absolute left-2"
				onClick={() => {
					$appPassword = '';
					goto('advanced-setup-step-1');
				}}><BackArrow /></IconButton
			>
		{/if}
		<span class="text-semibold text-center text-lg text-white">Advanced Setup (3 / 6)</span>
	</div>
</div>

<h1 class="h1 mb-10">2. Generate Recovery Keys</h1>

<div class="mb-10 ml-20 mr-20 rounded-lg bg-[#3f5b91] p-5 pl-10">
	<ul class="list-disc text-left text-lg font-semibold">
		<li>
			Data that you create with Holochain is signed by secret private keys stored on this device
		</li>
		<li>For every Holochain app a different private key will be used</li>
		<li>
			The following 3 steps guide you through the creation of a file containing encrypted recovery
			keys that allow you to regenerate the private keys used for your apps in case that you lose
			access to this device
		</li>
	</ul>
</div>

<Button
	props={{
		onClick: () => goto('advanced-setup-step-4')
	}}
>
	{$i18n.t('next')}
	<ArrowRight />
</Button>
