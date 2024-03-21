<script lang="ts">
	import { IconButton } from '$components';
	import { Gear, Home, Rocket, Upload } from '$icons';
	import { trpc } from '$services';
	import { APP_STORE, APPS_VIEW } from '$shared/types';

	const client = trpc();
	const closeSettings = client.closeSettings.createMutation();
	const isDevhubInstalled = client.isDevhubInstalled.createQuery();
</script>

<div class="app-region-drag flex justify-between p-3 dark:bg-apps-input-dark-gradient">
	<IconButton onClick={() => $closeSettings.mutate(APP_STORE)}><Home /></IconButton>
	<IconButton onClick={() => $closeSettings.mutate(APPS_VIEW)}><Rocket /></IconButton>
	{#if $isDevhubInstalled.data}
		<IconButton onClick={() => {}}><Upload /></IconButton>
	{/if}
	<IconButton buttonClass="ml-auto p-2 bg-black rounded-md"><Gear /></IconButton>
</div>
