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
		'--on-tertiary': '0 0 0',
		'--on-success': '0 0 0',
		'--on-warning': '0 0 0',
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
		// tertiary | #6c6c6c
		'--color-tertiary-50': '233 233 233', // #e9e9e9
		'--color-tertiary-100': '226 226 226', // #e2e2e2
		'--color-tertiary-200': '218 218 218', // #dadada
		'--color-tertiary-300': '196 196 196', // #c4c4c4
		'--color-tertiary-400': '152 152 152', // #989898
		'--color-tertiary-500': '108 108 108', // #6c6c6c
		'--color-tertiary-600': '97 97 97', // #616161
		'--color-tertiary-700': '81 81 81', // #515151
		'--color-tertiary-800': '65 65 65', // #414141
		'--color-tertiary-900': '53 53 53', // #353535
		// success | #07C245
		'--color-success-50': '218 246 227', // #daf6e3
		'--color-success-100': '205 243 218', // #cdf3da
		'--color-success-200': '193 240 209', // #c1f0d1
		'--color-success-300': '156 231 181', // #9ce7b5
		'--color-success-400': '81 212 125', // #51d47d
		'--color-success-500': '7 194 69', // #07C245
		'--color-success-600': '6 175 62', // #06af3e
		'--color-success-700': '5 146 52', // #059234
		'--color-success-800': '4 116 41', // #047429
		'--color-success-900': '3 95 34', // #035f22
		// warning | #FFB33A
		'--color-warning-50': '255 244 225', // #fff4e1
		'--color-warning-100': '255 240 216', // #fff0d8
		'--color-warning-200': '255 236 206', // #ffecce
		'--color-warning-300': '255 225 176', // #ffe1b0
		'--color-warning-400': '255 202 117', // #ffca75
		'--color-warning-500': '255 179 58', // #FFB33A
		'--color-warning-600': '230 161 52', // #e6a134
		'--color-warning-700': '191 134 44', // #bf862c
		'--color-warning-800': '153 107 35', // #996b23
		'--color-warning-900': '125 88 28', // #7d581c
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
