<script lang="ts">
	import { IconButton } from '$components';
	import { Gear, Home, Rocket } from '$icons';
	import { trpc } from '$services';

	import { APP_STORE, APPS_VIEW } from '../../../../../types';

	const client = trpc();
	const closeSettings = client.closeSettings.createMutation();
</script>

<div class="app-region-drag flex justify-between p-3 dark:bg-apps-input-dark-gradient">
	<IconButton onClick={() => $closeSettings.mutate(APP_STORE)}><Home /></IconButton>
	<IconButton onClick={() => $closeSettings.mutate(APPS_VIEW)} buttonClass="mr-2"
		><Rocket /></IconButton
	>
	<IconButton buttonClass="ml-auto p-2 bg-black rounded-md"><Gear /></IconButton>
</div>
