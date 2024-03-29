import dayjs from "dayjs"
import customParseFormat from "dayjs/plugin/customParseFormat"
import utc from "dayjs/plugin/utc"
dayjs.extend(customParseFormat)
dayjs.extend(utc)
dayjs.locale("en-gb")

import type { HtmlString } from "../../../@types/common"
import Modal from "../../components/modal"
import WindInput from "../../components/wind-input"

export default class PredictWindModal extends Modal {
    #timeGroupId: HtmlString
    #timeInputId: HtmlString
    #windInput = {} as WindInput

    constructor(title: string) {
        super(title, "sm", "Set")

        this.#timeGroupId = `input-group-${this.baseId}`
        this.#timeInputId = `input-${this.baseId}`

        this._init()
    }

    _init(): void {
        this._injectModal()
    }

    _injectModal(): void {
        const body = super.bodySel

        // Add wind input slider
        this.#windInput = new WindInput(body, this.baseId)

        // Add time input
        const form = body.select("form")
        const block = form.append("div").attr("class", "mt-3")
        block.append("label").attr("for", this.#timeInputId).text("Predict time (server time)")

        const inputGroup = block
            .append("div")
            .classed("input-group date", true)
            .attr("id", this.#timeGroupId)
            .attr("data-target-input", "nearest")
        inputGroup
            .append("input")
            .attr("class", "form-control")
            .attr("type", "time")
            .attr("id", this.#timeInputId)
            .attr("value", dayjs.utc().format("HH:mm"))
            .attr("data-bs-target", `#${this.#timeGroupId}`)
            .attr("aria-label", this.#timeGroupId)
            .attr("required", "")
    }

    getTime(): string {
        const input = document.querySelector(`#${this.#timeInputId}`) as HTMLInputElement

        return input.value.trim()
    }

    getWind(): number {
        return this.#windInput.getWind()
    }
}
