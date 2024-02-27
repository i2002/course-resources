const colors = require('tailwindcss/colors');

module.exports = {
	content: ['./resources/**/*.{js,jsx,ts,tsx}'],
	theme: {
		extend: {
			colors: {
				primary: colors.teal,
				secondary: colors.neutral,
			},
		},
	},
	darkMode: 'class',
	prefix: 'tw-',
	corePlugins: {
		preflight: false,
	},
	plugins: [
		require('@headlessui/tailwindcss'),
		require('@tailwindcss/typography'),
		require('@tailwindcss/forms')({
			strategy: 'class',
		}),
	],
	important: true,
};
