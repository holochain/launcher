import { skeleton } from '@skeletonlabs/tw-plugin';
import forms from '@tailwindcss/forms';
import { join } from 'path';
import type { Config } from 'tailwindcss';

import { appTheme } from './theme';

export default {
	darkMode: 'class',
	content: [
		'./src/**/*.{html,js,svelte,ts}',
		join(require.resolve('@skeletonlabs/skeleton'), '../**/*.{html,js,svelte,ts}')
	],
	theme: {
		extend: {
			colors: {
				'light-primary': 'rgb(25, 182, 227)',
				'light-background': 'rgba(0, 102, 255, 0.1)',
				'transparent-gray': '#dadada12'
			},
			backgroundImage: {
				'login-background': "url('/images/login-background.png')",
				'button-gradient':
					'linear-gradient(to top right, rgb(0, 212, 225) 15%, rgb(175, 0, 236) 70%)',
				'app-gradient':
					'linear-gradient(to bottom right, rgb(160, 0, 236) 15%, rgb(0, 85, 90) 70%)',
				'apps-input-dark-gradient': 'linear-gradient(to right, rgb(56, 52, 60), rgb(40, 40, 40))',
				'apps-list-dark-gradient':
					'linear-gradient(10deg, rgb(47, 45, 48) 15%, rgb(14, 17, 19) 45%)',
				'app-dark-gradient': `linear-gradient(350deg, rgba(0, 82, 205, 0.15) 5.32%, rgba(0, 0, 0, 0) 88.82%), linear-gradient(0deg, rgb(32, 33, 34), rgb(14, 17, 19)), linear-gradient(0deg, rgb(14, 17, 19), rgb(14, 17, 19))`,
				'add-happ-button': `linear-gradient(92.56deg, rgb(12, 142, 156) 20%, rgb(7, 194, 69) 84%)`,
				'modal-background': 'linear-gradient(180deg, #3F4651 0%, #212732 100%)',
				'app-details-gradient': `linear-gradient(to top, rgba(0, 0, 0, 5) 0%, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.2) 21%), linear-gradient(to bottom, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.2) 10%, rgba(0, 0, 0, 0.3) 48%), linear-gradient(90deg, rgba(100, 24, 160, 0.5) 0%, rgba(36, 9, 58, 0.5) 92%), linear-gradient(300.65deg, rgba(0, 209, 255, 0) 35.32%, rgba(0, 209, 255, 0.3) 72.93%)`
			},
			boxShadow: {
				'3xl': '0 35px 60px -15px rgba(0, 0, 0)'
			}
		}
	},
	plugins: [
		skeleton({
			themes: {
				custom: [appTheme]
			}
		}),
		forms
	]
} satisfies Config;
