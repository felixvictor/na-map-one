import { degreesFullCircle } from "common/na-map-data/constants"

export const GA_TRACKING_ID = "UA-109520372-1"

export const numberSegments = 24
export const segmentRadians = (2 * Math.PI) / numberSegments
export const circleRadiusFactor = 5
const secondsForFullCircle = 2935 // 48 * 60 + 55
export const degreesPerSecond = degreesFullCircle / secondsForFullCircle

export const maxTileZoom = 5
export const maxZoom = 8
export const tileSize = 256
export const minScale = tileSize
export const maxScale = minScale * Math.pow(2, maxZoom)
export const maxTileScale = minScale * Math.pow(2, maxTileZoom)
export const initScale = minScale << 3
export const labelScaleThreshold = minScale << 4
export const zoomAndPanScale = labelScaleThreshold
export const pbZoneScaleThreshold = minScale << 6

// eslint-disable-next-line one-var
declare const CGREEN: string,
    CGREENDARK: string,
    CGREENLIGHT: string,
    CLIGHT: string,
    CPRIMARY300: string,
    CRED: string,
    CREDDARK: string,
    CREDLIGHT: string,
    CWHITE: string,
    DESCRIPTION: string,
    NAME: string,
    TITLE: string,
    VERSION: string,
    ICONSMALL: string

export const appDescription = DESCRIPTION
export const appName = NAME
export const appTitle = TITLE
export const appVersion = VERSION

export const colourGreen = CGREEN
export const colourGreenDark = CGREENDARK
export const colourGreenLight = CGREENLIGHT
export const colourLight = CLIGHT
export const colourRed = CRED
export const colourRedDark = CREDDARK
export const colourRedLight = CREDLIGHT
export const colourWhite = CWHITE
export const colourPrimary300 = CPRIMARY300
export const iconSmallSrc = ICONSMALL
