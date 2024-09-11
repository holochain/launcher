import { get } from 'svelte/store';

import { goto } from '$app/navigation';
import { page } from '$app/stores';
import { SEARCH_URL_QUERY } from '$const';
import {
	ANIMATION_DURATION,
	APPS_VIEW,
	MIN_HEIGHT,
	WINDOW_SIZE,
	WINDOW_SIZE_LARGE
} from '$shared/const';
import type { MainScreenRoute } from '$shared/types';

export const setSearchInput = (event: Event) => {
	const target = event.target;

	goto(`?${SEARCH_URL_QUERY}=${(target as HTMLInputElement).value}`);
};

const getWindowSize = (destination: MainScreenRoute) =>
	destination === APPS_VIEW
		? { width: WINDOW_SIZE, height: MIN_HEIGHT }
		: { width: WINDOW_SIZE_LARGE, height: WINDOW_SIZE };

const resizeWindow = ({ width, height }: { width: number; height: number }) =>
	window.resizeTo(width, height);
const navigateTo = (destination: MainScreenRoute) => goto(`/${destination}`);

export const resizeWindowAndNavigate = (destination: MainScreenRoute) => {
	const size = getWindowSize(destination);
	resizeWindow(size);
	navigateTo(destination);
};

export const handleNavigationWithAnimationDelay =
	(setInputExpandedFalse?: () => void) => (destination: MainScreenRoute) => () => {
		setInputExpandedFalse?.();
		setTimeout(() => resizeWindowAndNavigate(destination), ANIMATION_DURATION);
	};

export const goBack = () => {
	const { url } = get(page);
	const lastSlashIndex = url.pathname.lastIndexOf('/');
	goto(url.pathname.substring(0, lastSlashIndex));
};

export const isDev = () => get(page).url.hostname === 'localhost';
