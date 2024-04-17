<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { SEARCH_URL_QUERY } from '$const';

	import MainHeader from '../components/MainHeader.svelte';

	$: searchInput = $page.url.searchParams.get(SEARCH_URL_QUERY) || '';

	function handlePress(event: CustomEvent) {
		if (!(event.detail instanceof KeyboardEvent)) return;

		const { key } = event.detail;

		if (key === 'Escape' && searchInput !== '') {
			event.detail.stopPropagation();
			goto(`?${SEARCH_URL_QUERY}=`);
		}
	}
</script>

<MainHeader {handlePress} />
<slot />
