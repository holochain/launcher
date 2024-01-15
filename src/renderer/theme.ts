import type { CustomThemeConfig } from '@skeletonlabs/tw-plugin';

export const appTheme: CustomThemeConfig = {
	name: 'app-theme',
	properties: {
		// =~= Theme Properties =~=
		'--theme-font-family-base': `Figtree`,
		'--theme-font-family-heading': `Figtree`,
		'--theme-font-color-base': '0 0 0',
		'--theme-font-color-dark': '255 255 255',
		'--theme-rounded-base': '9999px',
		'--theme-rounded-container': '8px',
		'--theme-border-base': '1px',
		// =~= Theme On-X Colors =~=
		'--on-primary': '255 255 255',
		'--on-secondary': '255 255 255',
		'--on-tertiary': '255 255 255',
		'--on-success': '255 255 255',
		'--on-warning': '255 255 255',
		'--on-error': '255 255 255',
		'--on-surface': '0 0 0',
		// =~= Theme Colors  =~=
		// primary | #A000EC
		'--color-primary-50': '241 217 252', // #f1d9fc
		'--color-primary-100': '236 204 251', // #ecccfb
		'--color-primary-200': '231 191 250', // #e7bffa
		'--color-primary-300': '217 153 247', // #d999f7
		'--color-primary-400': '189 77 242', // #bd4df2
		'--color-primary-500': '160 0 236', // #A000EC
		'--color-primary-600': '144 0 212', // #9000d4
		'--color-primary-700': '120 0 177', // #7800b1
		'--color-primary-800': '96 0 142', // #60008e
		'--color-primary-900': '78 0 116', // #4e0074
		// secondary | #00555A
		'--color-secondary-50': '217 230 230', // #d9e6e6
		'--color-secondary-100': '204 221 222', // #ccddde
		'--color-secondary-200': '191 213 214', // #bfd5d6
		'--color-secondary-300': '153 187 189', // #99bbbd
		'--color-secondary-400': '77 136 140', // #4d888c
		'--color-secondary-500': '0 85 90', // #00555A
		'--color-secondary-600': '0 77 81', // #004d51
		'--color-secondary-700': '0 64 68', // #004044
		'--color-secondary-800': '0 51 54', // #003336
		'--color-secondary-900': '0 42 44', // #002a2c
		// tertiary | #38343C
		'--color-tertiary-50': '225 225 226', // #e1e1e2
		'--color-tertiary-100': '215 214 216', // #d7d6d8
		'--color-tertiary-200': '205 204 206', // #cdccce
		'--color-tertiary-300': '175 174 177', // #afaeb1
		'--color-tertiary-400': '116 113 119', // #747177
		'--color-tertiary-500': '56 52 60', // #38343C
		'--color-tertiary-600': '50 47 54', // #322f36
		'--color-tertiary-700': '42 39 45', // #2a272d
		'--color-tertiary-800': '34 31 36', // #221f24
		'--color-tertiary-900': '27 25 29', // #1b191d
		// success | #15171E
		'--color-success-50': '220 220 221', // #dcdcdd
		'--color-success-100': '208 209 210', // #d0d1d2
		'--color-success-200': '197 197 199', // #c5c5c7
		'--color-success-300': '161 162 165', // #a1a2a5
		'--color-success-400': '91 93 98', // #5b5d62
		'--color-success-500': '21 23 30', // #15171E
		'--color-success-600': '19 21 27', // #13151b
		'--color-success-700': '16 17 23', // #101117
		'--color-success-800': '13 14 18', // #0d0e12
		'--color-success-900': '10 11 15', // #0a0b0f
		// warning | #1a626e
		'--color-warning-50': '221 231 233', // #dde7e9
		'--color-warning-100': '209 224 226', // #d1e0e2
		'--color-warning-200': '198 216 219', // #c6d8db
		'--color-warning-300': '163 192 197', // #a3c0c5
		'--color-warning-400': '95 145 154', // #5f919a
		'--color-warning-500': '26 98 110', // #1a626e
		'--color-warning-600': '23 88 99', // #175863
		'--color-warning-700': '20 74 83', // #144a53
		'--color-warning-800': '16 59 66', // #103b42
		'--color-warning-900': '13 48 54', // #0d3036
		// error | #FF3A69
		'--color-error-50': '255 225 233', // #ffe1e9
		'--color-error-100': '255 216 225', // #ffd8e1
		'--color-error-200': '255 206 218', // #ffceda
		'--color-error-300': '255 176 195', // #ffb0c3
		'--color-error-400': '255 117 150', // #ff7596
		'--color-error-500': '255 58 105', // #FF3A69
		'--color-error-600': '230 52 95', // #e6345f
		'--color-error-700': '191 44 79', // #bf2c4f
		'--color-error-800': '153 35 63', // #99233f
		'--color-error-900': '125 28 51', // #7d1c33
		// surface | #202122
		'--color-surface-50': '222 222 222', // #dedede
		'--color-surface-100': '210 211 211', // #d2d3d3
		'--color-surface-200': '199 200 200', // #c7c8c8
		'--color-surface-300': '166 166 167', // #a6a6a7
		'--color-surface-400': '99 100 100', // #636464
		'--color-surface-500': '32 33 34', // #202122
		'--color-surface-600': '29 30 31', // #1d1e1f
		'--color-surface-700': '24 25 26', // #18191a
		'--color-surface-800': '19 20 20', // #131414
		'--color-surface-900': '16 16 17' // #101011
	}
};
