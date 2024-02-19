<script lang="ts">
	import { Button } from '$components';
	import { Gear, Home, Rocket } from '$icons';
	import { trpc } from '$services';

	import { APP_STORE, APPS_VIEW } from '../../../../../types';

	const client = trpc();
	const closeSettings = client.closeSettings.createMutation();
</script>

<div class="app-region-drag flex justify-between p-3 dark:bg-apps-input-dark-gradient">
	<Button
		props={{
			class: 'p-2 app-region-no-drag',
			onClick: () => $closeSettings.mutate(APP_STORE)
		}}
	>
		<Home />
	</Button>
	<Button
		props={{
			class: 'p-2 mr-2 app-region-no-drag',
			onClick: () => $closeSettings.mutate(APPS_VIEW)
		}}
	>
		<Rocket />
	</Button>
	<Button
		props={{
			class: 'ml-auto app-region-no-drag p-2 bg-black rounded-md'
		}}
	>
		<Gear />
	</Button>
</div>
