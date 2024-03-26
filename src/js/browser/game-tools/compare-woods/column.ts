import { select as d3Select, type Selection } from "d3-selection"

import type { Amount } from "compare-woods"
import type { HtmlString } from "../../../@types/common"
import type { WoodProperty, WoodTrimOrFrame } from "../../../@types/na-map-data/woods"
import { WoodData } from "./data"

export class Column {
    #div: Selection<HTMLDivElement, unknown, HTMLElement, unknown>
    readonly #woodData: WoodData

    constructor(divOutputId: HtmlString, woodData: WoodData) {
        this.#div = d3Select(`#${divOutputId}`)
        this.#woodData = woodData

        this._setupMainDiv()
    }

    get div(): Selection<HTMLDivElement, unknown, HTMLElement, unknown> {
        return this.#div
    }

    get woodData(): WoodData {
        return this.#woodData
    }

    _setupMainDiv(): void {
        this.#div.select("div").remove()
        this.#div.append("div")
    }

    getProperty(data: WoodTrimOrFrame, modifierName: string): Amount {
        const property = data?.properties.find((prop) => prop.modifier === modifierName) ?? ({} as WoodProperty)

        const amount = property?.amount ?? 0
        const isPercentage = property?.isPercentage ?? false

        return { amount, isPercentage }
    }
}
