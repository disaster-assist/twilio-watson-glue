const webpack = require('webpack');
const path = require('path');

module.exports = {
    entry: './src/index.js',
    mode: 'development',
    /*module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                exclude: /node_modules/,
                //options: { reportFiles: [''] }
            }
        ]
    },

    resolve: {
        extensions: [ '.tsx', '.ts', '.js' ]
    },*/

    target: 'node',
    output: {
        filename: 'index.min.js',
        path: path.resolve(__dirname, 'dist')
    },
    /*plugins: [
        new webpack.IgnorePlugin(/electron/)
    ]*/
};

