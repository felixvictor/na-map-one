import path from "path"
import webpack from "webpack"

import CopyPlugin from "copy-webpack-plugin"
import { CleanWebpackPlugin } from "clean-webpack-plugin"
import FaviconsPlugin from "favicons-webpack-plugin"
import type { FaviconWebpackPlugionOptions } from "favicons-webpack-plugin/src/options.js"
import HtmlPlugin from "html-webpack-plugin"
import MiniCssExtractPlugin from "mini-css-extract-plugin"
import SitemapWebpackPlugin from "sitemap-webpack-plugin"
import { SubresourceIntegrityPlugin } from "webpack-subresource-integrity"

import { sortBy } from "../src/js/common/na-map-data/sort"
import { servers } from "../src/js/common/na-map-data/servers"
import PACKAGE from "../package.json"
import {
    backgroundColour,
    colourGreen,
    colourGreenDark,
    colourGreenLight,
    colourLight,
    colourRed,
    colourRedDark,
    colourRedLight,
    colourWhite,
    primary300,
    themeColour,
} from "./colours"
import { dirEjs, dirMap, dirOutput, dirPrefixIcons, dirSrc, fileLogo } from "./dir"
import { isProduction, TARGET } from "./env"
import type { RepairList } from "./repairs"

const libraryName = PACKAGE.name
const descriptionLong =
    "Yet another map with in-game map, resources, ship and wood comparisons. Data is updated daily after maintenance."
const targetUrl = TARGET ? `https://${TARGET}.netlify.app/` : `http://localhost/na/`
const sitemapPaths = ["/fonts/", "/icons", "/images"]

const htmlMinifyOpt = {
    collapseBooleanAttributes: true,
    collapseInlineTagWhitespace: true,
    collapseWhitespace: false,
    decodeEntities: true,
    html5: true,
    minifyURLs: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    sortAttributes: true,
    sortClassName: true,
    useShortDoctype: true,
}

// noinspection JSIncompatibleTypesComparison
const htmlOpt: HtmlPlugin.Options = {
    iconSmall: `${dirPrefixIcons}/android-chrome-48x48.png`,
    iconLarge: `${dirPrefixIcons}/firefox_app_512x512.png`,
    canonicalUrl: TARGET === "na-map" ? targetUrl : "",
    name: libraryName,
    description: descriptionLong,
    hash: false,
    inject: "body",
    lang: "en-GB",
    meta: { viewport: "width=device-width, initial-scale=1, shrink-to-fit=no" },
    minify: htmlMinifyOpt,
    scriptLoading: "defer",
    servers: servers.sort(sortBy(["order"])),
    template: path.resolve(dirEjs, "index.ejs"),
    title: PACKAGE.description,
}

const faviconsOpt: FaviconWebpackPlugionOptions = {
    logo: fileLogo,
    cache: true,
    devMode: "webapp",
    inject: true,
    prefix: `${dirPrefixIcons}/`,
    favicons: {
        appDescription: PACKAGE.description,
        appName: PACKAGE.name,
        appShortName: PACKAGE.name,
        background: backgroundColour,
        icons: {
            android: true,
            appleIcon: false,
            appleStartup: false,
            favicons: true,
            windows: true,
            yandex: false,
        },
        lang: "en-GB",
        start_url: "/",
        theme_color: themeColour,
        version: PACKAGE.version,
    },
}

export const getPluginConfig = (repairs: RepairList | undefined) => {
    return [
        new CleanWebpackPlugin(),
        new MiniCssExtractPlugin({
            filename: isProduction ? "[name].[contenthash].css" : "[name].css",
        }),
        new webpack.DefinePlugin({
            CGREEN: JSON.stringify(colourGreen),
            CGREENDARK: JSON.stringify(colourGreenDark),
            CGREENLIGHT: JSON.stringify(colourGreenLight),
            CLIGHT: JSON.stringify(colourLight),
            CPRIMARY300: JSON.stringify(primary300),
            CRED: JSON.stringify(colourRed),
            CREDDARK: JSON.stringify(colourRedDark),
            CREDLIGHT: JSON.stringify(colourRedLight),
            CWHITE: JSON.stringify(colourWhite),
            DESCRIPTION: JSON.stringify(descriptionLong),
            ICONSMALL: JSON.stringify(`${dirPrefixIcons}/android-chrome-48x48.png`),
            NAME: JSON.stringify(libraryName),
            TITLE: JSON.stringify(PACKAGE.description),
            VERSION: JSON.stringify(PACKAGE.version),
            REPAIR_ARMOUR_VOLUME: JSON.stringify(repairs?.armorRepair.volume),
            REPAIR_ARMOUR_PERCENT: JSON.stringify(repairs?.armorRepair.percent),
            REPAIR_ARMOUR_TIME: JSON.stringify(repairs?.armorRepair.time),
            REPAIR_SAIL_VOLUME: JSON.stringify(repairs?.sailRepair.volume),
            REPAIR_SAIL_PERCENT: JSON.stringify(repairs?.sailRepair.percent),
            REPAIR_CREW_VOLUME: JSON.stringify(repairs?.crewRepair.volume),
            REPAIR_CREW_PERCENT: JSON.stringify(repairs?.crewRepair.percent),
        }),
        new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery",
            "window.jQuery": "jquery",
            "window.Dropdown": "bootstrap/js/dist/dropdown",
        }),
        new CopyPlugin({
            patterns: [
                { from: "netlify.toml" },
                { from: `${dirSrc}/google979f2cf3bed204d6.html` },
                { from: dirMap, to: `${dirOutput}/images/map` },
            ],
        }),
        new HtmlPlugin(htmlOpt),
        new FaviconsPlugin(faviconsOpt),
        new SitemapWebpackPlugin({ base: targetUrl, paths: sitemapPaths, options: { skipgzip: false } }),
        new SubresourceIntegrityPlugin(),
    ]
}
