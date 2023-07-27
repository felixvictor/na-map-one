import Modal from "../../components/modal"
import WindInput from "../../components/wind-input"
import { HtmlString } from "../../../@types/common"

export default class WindRoseModal extends Modal {
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
    }

    getTime(): string {
        const input = document.querySelector(`#${this.#timeInputId}`) as HTMLInputElement

        return input.value.trim()
    }

    getWind(): number {
        return this.#windInput.getWind()
    }
}
