<script lang="ts">
	import { Button } from '$components';
	import { Gear } from '$icons';
	import { trpc } from '$services';

	const client = trpc();

	const openSettings = client.openSettings.createMutation();
</script>

<div class="flex bg-apps-input-dark-gradient p-3">
	<div class="row flex flex-grow"><slot /></div>
	<Button
		props={{
			type: 'button',
			class: '',
			onClick: () => $openSettings.mutate()
		}}
	>
		<Gear />
	</Button>
</div>
