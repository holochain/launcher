import { sveltekit } from '@sveltejs/kit/vite';
import path from 'path';
import { defineConfig } from 'vite';
import { purgeCss } from 'vite-plugin-tailwind-purgecss';

export default defineConfig({
	plugins: [sveltekit(), purgeCss()],
	resolve: {
		alias: {
			'appstore-tools': path.resolve(__dirname, '../../libs/appstore/dist')
		}
	},
	optimizeDeps: {
		include: ['appstore-tools']
	}
});
