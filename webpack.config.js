const path = require("path");
const webpack = require("webpack")
const glob = require("glob");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const {CleanWebpackPlugin} = require("clean-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");


const entryPts = getEntryPoints();

function getEntryPoints() {
    const entries = {};
    const tsFiles = glob.sync('./src/**/*.ts');

    tsFiles.forEach((file) => {
        const entryName = path.basename(file, '.ts');
        
        entries[entryName] = "./" + file;
    })

    return entries;
}

module.exports = {
    mode: "development",
    entry: entryPts,
    output: {
        filename: "./[name].bundle.js",
        path: path.resolve(__dirname, "./public/build")
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
    },
    plugins: [
        new CleanWebpackPlugin({
            verbose: true,
        }),
        new HtmlWebpackPlugin({
            template: './public/index.html',
            filename: 'index.html',
            chunks: Object.keys(getEntryPoints()),
        }),
        new CopyWebpackPlugin({
            patterns: [
                {from: 'public/json'}
            ]
        })
    ]
}