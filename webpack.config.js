const path = require("path");
const webpack = require("webpack")

module.exports = {
    mode: "development",
    entry: "./src/index.ts",
    output: {
        filename: "./build/bundle.js",
        path: path.resolve(__dirname, "./public")
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.css$/,
                use: [ 'style-loader', 'css-loader' ],
            }
        ]
    },
    watch: true,
    watchOptions: {
        ignored: /node_modules/,
        aggregateTimeout: 300,
        poll: 1000
    }
}