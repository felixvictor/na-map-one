import type { HtmlString } from "../../../@types/common"
import Modal from "../../components/modal"
import WindInput from "../../components/wind-input"

export default class WindRoseModal extends Modal {
    #timeInputId: HtmlString
    #windInput = {} as WindInput

    constructor(title: string) {
        super(title, "sm", "Set")

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
    }

    getTime(): string {
        const input = document.querySelector(`#${this.#timeInputId}`) as HTMLInputElement

        return input.value.trim()
    }

    getWind(): number {
        return this.#windInput.getWind()
    }
}
