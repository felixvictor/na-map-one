/**
 * webpack.config
 */

import path from "node:path"
import webpack from "webpack"

// const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer")

import { loaders } from "./loader"
import { minimiser } from "./minimise"
import { getPluginConfig } from "./plugin"
import { getRepairList } from "./repairs"

import { aliasPaths, dirJs, dirOutput } from "./dir"
import { isProduction, TARGET } from "./env"

const publicPath = TARGET || !isProduction ? "/" : `http://localhost/na/`

const config: webpack.Configuration = {
    devtool: isProduction ? false : "eval-source-map",

    entry: [path.resolve(dirJs, "browser/main.ts")],

    externals: {
        jquery: "jQuery",
        "popper.js": "Popper",
    },

    optimization: {
        minimize: isProduction,
        minimizer: isProduction ? minimiser : undefined,
        runtimeChunk: "single",
        splitChunks: {
            chunks: "all",
        },
    },

    output: {
        crossOriginLoading: "anonymous",
        filename: isProduction ? "[name].[contenthash].js" : "[name].js",
        path: dirOutput,
        publicPath,
    },

    resolve: {
        alias: aliasPaths,
        extensions: [".ts", ".js", ".json"],
    },

    target: isProduction ? "browserslist" : "web",

    stats: {
        // Add chunk information (setting this to `false` allows for a less verbose output)
        chunks: true,

        // Add namedChunkGroups information
        chunkGroups: true,

        // Add built modules information to chunk information
        chunkModules: true,

        // Add the origins of chunks and chunk merging info
        chunkOrigins: true,

        excludeAssets: [/images\/map\/*/],
    },

    module: {
        rules: loaders,
    },
}

/*
if (isProduction && !isQuiet) {
    config.plugins.push(
        new BundleAnalyzerPlugin.BundleAnalyzerPlugin({
            analyzerMode: "static",
            generateStatsFile: true,
            logLevel: "warn",
            openAnalyzer: true,
            statsFilename: path.resolve(__dirname, "webpack-stats.json"),
            reportFilename: path.resolve(__dirname, "report.html"),
        })
    )
}
*/

const doAsync = async () => {
    const repairs = await getRepairList()
    config.plugins = getPluginConfig(repairs)
    return config
}
module.exports = doAsync
