<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button, Input, ListOfApps, MainHeader } from '$components';
	import { Home, Rocket } from '$icons';
	import { i18n } from '$services';

	let searchInput = '';
</script>

<MainHeader>
	<Button
		props={{
			type: 'button',
			class: 'p-2',
			onClick: () => {
				goto('/main/app-store');
			}
		}}
	>
		<Home fillColor="white" />
	</Button>
	<div class="relative mx-2 flex-grow">
		<Input
			bind:value={searchInput}
			props={{
				class: 'pl-10 input rounded placeholder-tertiary-500 text-base font-medium',
				type: 'text',
				placeholder: $i18n.t('whatDoYouWantToLaunch')
			}}
		/>
		<div class="absolute left-2 top-2 z-10">
			<Rocket />
		</div>
	</div>
</MainHeader>
<ListOfApps {searchInput} />
