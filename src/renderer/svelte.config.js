import adapter from '@sveltejs/adapter-static';
import { vitePreprocess as preprocess } from '@sveltejs/kit/vite';
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
			$services: path.resolve('./src/lib/services')
		}
	}
};

export default config;
