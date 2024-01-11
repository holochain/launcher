<div class="relative flex h-screen flex-col bg-login-background bg-fixed bg-top bg-no-repeat">
	<div class="absolute inset-0 bg-tertiary-900 opacity-50" />
	<!-- White overlay div -->
	<p class="z-10 p-1 text-center text-xs opacity-30">Holochain Beta 0.1</p>
	<div class="max-w-s z-10 flex flex-1 flex-col items-center justify-center text-center">
		<slot />
	</div>
</div>
