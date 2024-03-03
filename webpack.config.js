// const path = require('path');
const defaults = require('@wordpress/scripts/config/webpack.config.js');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
	...defaults,
	entry: {
		backend: `./resources/scripts/backend.ts`,
		frontend: `./resources/scripts/frontend.tsx`,
	},
	plugins: [
		...defaults.plugins,
		new CopyPlugin({
			patterns: [
				{
					from: 'pdfjs-dist/cmaps/',
					to: 'pdfjs-cmaps/',
					context: 'node_modules',
				},
			],
		}),
	],
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
	optimization: {
		splitChunks: {
			cacheGroups: {
				vendor: {
					test: /[\\/]node_modules[\\/]/,
					name: 'vendors',
					chunks: 'all',
				},
			},
		},
	},
};
