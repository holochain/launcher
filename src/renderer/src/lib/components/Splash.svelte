<script lang="ts">
	import { Application } from '@splinetool/runtime';
	import { onMount } from 'svelte';

	let canvas: HTMLCanvasElement | undefined;
	let app: Application | undefined;

	const getCanvasElement = (): HTMLCanvasElement | undefined => {
		const element = document.getElementById('canvas');
		return element instanceof HTMLCanvasElement ? element : undefined;
	};

	const setCanvasSize = (canvas: HTMLCanvasElement) => {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
	};

	const initializeApplication = (canvas: HTMLCanvasElement) => {
		const appInstance = new Application(canvas);
		appInstance.load('/spine/scene.splinecode');
		return appInstance;
	};

	const handleResize = (canvas: HTMLCanvasElement) => () => setCanvasSize(canvas);

	onMount(() => {
		const canvasElement = getCanvasElement();
		if (!canvasElement) return;

		canvas = canvasElement;
		setCanvasSize(canvas);
		app = initializeApplication(canvas);

		const resizeListener = handleResize(canvas);
		window.addEventListener('resize', resizeListener);

		return () => {
			app?.dispose();
			window.removeEventListener('resize', resizeListener);
		};
	});
</script>

<svelte:head>
	<script async src="https://unpkg.com/es-module-shims@1.3.6/dist/es-module-shims.js"></script>
</svelte:head>

<canvas id="canvas" width="100" height="100" />
