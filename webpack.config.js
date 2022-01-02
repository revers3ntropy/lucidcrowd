const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
	entry: './app.ts',
	output: {
		filename: 'webpack_out.js',
		path: path.resolve(__dirname, ''),
	},
	mode: 'production',
	resolve: {
		extensions: ['.tsx', '.ts', '.js'],
	},
	module: {
		rules: [
			{
				test: /\.less$/,
				use: [
					'style-loader',
					'css-loader',
					'less-loader'
				],
			},
			{
				test: /\.tsx?$/,
				loader: 'ts-loader',
				options: {
					configFile: "tsconfig.json"
				},
				exclude: /node_modules/,
			},
		]
	},
	plugins: isProduction ? [
		new MiniCssExtractPlugin()
	] : [

	]
};