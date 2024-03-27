import { sveltekit } from '@sveltejs/kit/vite';
import fs from 'fs';
import path from 'path';
import { defineConfig, type PluginOption } from 'vite';
import { purgeCss } from 'vite-plugin-tailwind-purgecss';

const base64Loader = (): PluginOption => ({
	name: 'base64-loader',
	enforce: 'pre' as const,
	transform(code: string, id: string) {
		if (!id.endsWith('?base64')) return null;
		const filePath = id.slice(0, -'?base64'.length);
		const data = fs.readFileSync(filePath);
		const base64 = data.toString('base64');
		return `export default '${base64}';`;
	}
});

export default defineConfig({
	plugins: [base64Loader(), sveltekit(), purgeCss()],
	resolve: {
		alias: {
			'appstore-tools': path.resolve(__dirname, '../../libs/appstore/dist')
		}
	},
	optimizeDeps: {
		include: ['appstore-tools']
	}
});
