import { onDestroy, onMount } from 'svelte';

export function useFocusRefetch(refetch: () => void) {
	let focusHandler: () => void;

	onMount(() => {
		focusHandler = () => refetch();
		window.addEventListener('focus', focusHandler);
	});

	onDestroy(() => {
		window.removeEventListener('focus', focusHandler);
	});
}
