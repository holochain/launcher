import adapter from '@sveltejs/adapter-static';
import { vitePreprocess as preprocess } from '@sveltejs/vite-plugin-svelte';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const buildDir = path.join(__dirname, '..', '..', 'out', 'renderer');

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: [preprocess()],

	kit: {
		adapter: adapter({
			fallback: 'index.html',
			pages: buildDir,
			assets: buildDir
		}),
		alias: {
			$components: path.resolve('./src/lib/components'),
			$services: path.resolve('./src/lib/services'),
			$locale: path.resolve('./src/lib/locale'),
			$helpers: path.resolve('./src/lib/helpers'),
			$types: path.resolve('./src/lib/types'),
			$stores: path.resolve('./src/lib/stores'),
			$icons: path.resolve('./src/lib/icons'),
			$const: path.resolve('./src/lib/const'),
			$modal: path.resolve('./src/lib/modal'),
			$shared: path.resolve('../shared')
		}
	}
};

export default config;
