<script lang="ts">
	import { AppStore } from '$types';

	import MainHeader from '../components/MainHeader.svelte';

	let searchInput = '';

	function handlePress(event: CustomEvent) {
		if (!(event.detail instanceof KeyboardEvent)) return;

		const { key } = event.detail;

		if (key === 'Escape' && searchInput !== '') {
			event.detail.stopPropagation();
			searchInput = '';
		}
	}
</script>

<MainHeader {handlePress} bind:searchInput type={AppStore} />

<div class="align-center bg-apps-list-dark-gradient flex grow justify-center bg-fixed">
	<span class="pt-4">App Store Placeholder</span>
</div>
