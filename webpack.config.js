// const path = require('path');
const defaults = require('@wordpress/scripts/config/webpack.config.js');

module.exports = {
	...defaults,
	entry: {
		backend: `./resources/scripts/backend.ts`,
		frontend: `./resources/scripts/frontend.tsx`,
	},
	plugins: [...defaults.plugins],
	module: {
		...defaults.module,
		rules: [
			...defaults.module.rules,
			{
				test: /\.tsx?$/,
				use: [
					{
						loader: 'ts-loader',
						options: {
							configFile: 'tsconfig.json',
							transpileOnly: true,
						},
					},
				],
			},
		],
	},
	resolve: {
		extensions: [
			'.ts',
			'.tsx',
			...(defaults.resolve
				? defaults.resolve.extensions || ['.js', '.jsx']
				: []),
		],
	},
};
