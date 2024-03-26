import { woodFamily, woodType } from "./constants.js"
import type { ObjectIndexer } from "./index.js"

export type WoodFamily = (typeof woodFamily)[number]
export type WoodType = (typeof woodType)[number]

export type WoodJsonData = {
    [K in WoodType]: WoodTrimOrFrame[]
}
interface WoodTrimOrFrame {
    id: number
    properties: WoodProperty[]
    type: WoodType
    name: string
    family: WoodFamily
}
interface WoodProperty extends ObjectIndexer<boolean | number | string> {
    modifier: string
    amount: number
    isPercentage: boolean
}
