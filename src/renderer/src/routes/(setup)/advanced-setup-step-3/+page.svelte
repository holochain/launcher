<script lang="ts">
	import { goto } from '$app/navigation';
	import { i18n } from '$services';
	import { BackArrow, ArrowRight } from '$icons';
	import { IconButton, Button } from '$components';
	import { appPassword } from '$stores';

</script>

<div class="fixed top-0 left-0 right-0 app-region-drag flex items-center justify-between p-3 bg-[#DADADA12]">
	<div class="relative flex w-full items-center justify-center py-[11px]">
		<IconButton buttonClass="absolute left-2" onClick={() => {
			$appPassword = '';
			goto('advanced-setup-step-1')
		}}><BackArrow /></IconButton>
		<span class="text-center text-semibold text-lg text-white">Advanced Setup (3 / 6)</span>
	</div>
</div>


<h1 class="h1 mb-10">2. Generate Recovery Keys</h1>

<div class="p-5 pl-10 mr-20 ml-20 bg-[#3f5b91] mb-10 rounded-lg">
	<ul class="list-disc text-lg text-left font-semibold">
		<li>Data that you create with Holochain is signed by secret private keys stored on this device</li>
		<li>For every Holochain app a different private key will be used</li>
		<li>The following 3 steps guide you through the creation of a file containing encrypted recovery keys that allow you to regenerate the private
			keys used for your apps in case that you lose access to this device</li>
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
