const path = require('path');
const htmlPlugin = require('html-webpack-plugin');

const PATHS = {
    app: path.join(__dirname, '../src'),
    images: path.join(__dirname, '../src/assets/'),
    build: path.join(__dirname, '../dist')
};

module.exports = {
    entry: {
        app: ['babel-polyfill', PATHS.app + '/index.js']
    },
    output: {
        path: PATHS.build,
        filename: 'bundle.js'
    },
    module: {
        rules: [
            {
                test: /\.yaml$/,
                exclude: /node_modules/,
                use: 'js-yaml-loader'
            },
            {
                test: /\.jsx$/,
                exclude: /node_modules/,
                use: 'babel-loader'
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: 'babel-loader'
            },
            {
                test: /\.css$/i,
                exclude: /node_modules/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.(ico|jpg|png|gif|eot|otf|webp|svg|ttf|woff|woff2)(\?.*)?$/,
                use: {
                    loader: 'file-loader',
                    options: {
                        name: '[path][name].[ext]'
                    }
                }
            }
        ]
    },
    resolve: {
        extensions: ['.js', '.jsx']
    },
    plugins: [
        new htmlPlugin({filename: 'index.html'})
    ]
};