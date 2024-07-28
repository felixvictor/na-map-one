import type { HtmlString } from "../../../@types/common"
import Modal from "../../components/modal"
import type { WoodColumnType } from "./index"

export default class CompareWoodsModal extends Modal {
    readonly #columnIds: WoodColumnType[]

    constructor(title: string, columnIds: WoodColumnType[]) {
        super(title, "xl")

        this.#columnIds = columnIds

        this._init()
    }

    getBaseIdSelects(columnId: WoodColumnType): HtmlString {
        return `${super.baseIdSelects}-${columnId}`
    }

    getBaseIdOutput(columnId: WoodColumnType): HtmlString {
        return `${super.baseIdOutput}-${columnId}`
    }

    _init(): void {
        this._injectModal()
    }

    _injectModal(): void {
        const body = super.bodySel

        const row = body.append("div").attr("class", "container-fluid").append("div").attr("class", "row wood")
        for (const columnId of this.#columnIds) {
            const columnDiv = row
                .append("div")
                .attr("class", `col-md-3 ms-auto pt-2 ${columnId === "base" ? "column-base" : "column-comp bg-paper"}`)

            columnDiv.append("div").attr("id", this.getBaseIdSelects(columnId))
            columnDiv.append("div").attr("id", this.getBaseIdOutput(columnId))
        }
    }
}
