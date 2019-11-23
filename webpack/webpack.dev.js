const merge = require('webpack-merge');
const openBrowserPlugin = require('open-browser-webpack-plugin');

const common = require('./webpack.common.js');

const options = {
	host: 'localhost',
	port: '3000'
};

module.exports = merge(common, {
	devtool: 'inline-cheap-module-source-map',
	devServer: {
		hot: true,
		inline: true,
		stats: 'errors-only',
		host: options.host,
		port: options.port,
		contentBase: './dist',
		historyApiFallback: true
	},
	plugins: [
		new openBrowserPlugin({url: `http://${options.host}:${options.port}`})
	]
});