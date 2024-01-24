<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button, MainHeader } from '$components';
	import { Home, Rocket } from '$icons';
</script>

<MainHeader>
	<Button
		props={{
			type: 'button',
			class: 'bg-success-800 p-2 rounded-md',
			onClick: () => {
				goto('/main/app-store');
			}
		}}
	>
		<Home fillColor="white" />
	</Button>
	<Button
		props={{
			type: 'button',
			class: 'p-2 ml-2',
			onClick: () => {
				goto('/main/apps-view');
			}
		}}
	>
		<Rocket />
	</Button>
</MainHeader>
<div class="align-center bg-apps-list-dark-gradient flex grow justify-center bg-fixed">
	<span class="pt-4">App Store Placeholder</span>
</div>
