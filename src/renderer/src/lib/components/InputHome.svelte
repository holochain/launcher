<script lang="ts">
	import { Button, Input } from '$components';
	import { Gear, Rocket } from '$icons';
	import { i18n, trpc } from '$services';

	const client = trpc();

	export let searchInput: string;

	const openSettings = client.openSettings.createMutation();
</script>

<div class="relative flex bg-apps-input-dark-gradient">
	<div class="absolute left-6 top-6 z-10">
		<Rocket />
	</div>
	<Input
		bind:value={searchInput}
		props={{
			class: 'pl-10 input rounded my-4 ml-4 placeholder-tertiary-500 text-base font-medium',
			type: 'text',
			placeholder: $i18n.t('whatDoYouWantToLaunch')
		}}
	/>
	<Button
		props={{
			type: 'button',
			class: 'pr-2 pt-4',
			onClick: () => $openSettings.mutate()
		}}
	>
		<Gear />
	</Button>
</div>
