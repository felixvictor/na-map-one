import { compassDirections, compassToDegrees, degreesToCompass } from "common/na-map-data/coordinates"
import type { Selection } from "d3-selection"
import "round-slider/src/roundslider"
import type { HtmlString } from "../../@types/common"
import { displayCompass } from "../util"

export default class WindInput {
    readonly #baseId: string
    readonly #formId: HtmlString
    readonly #sliderId: HtmlString
    readonly #mainElement = {} as Selection<HTMLDivElement, unknown, HTMLElement, unknown>

    #slider$ = {} as JQuery

    constructor(element: Selection<HTMLDivElement, unknown, HTMLElement, unknown>, id: HtmlString) {
        this.#mainElement = element
        this.#baseId = id

        this.#formId = `form-${this.#baseId}`
        this.#sliderId = `slider-${this.#baseId}`

        this._inject()
        this.#slider$ = $(`#${this.#sliderId}`)
        this._setup()
    }

    _setup(): void {
        window.sliderTooltip = (arguments_: Record<string, unknown>) =>
            `${displayCompass(String(arguments_.value))}<br>${String(arguments_.value)}°`

        this.#slider$.roundSlider({
            sliderType: "default",
            handleSize: "+1",
            startAngle: 90,
            width: 20,
            radius: 110,
            min: 0,
            max: 359,
            step: 360 / compassDirections.length,
            editableTooltip: false,
            tooltipFormat: "sliderTooltip",
            create() {
                // @ts-expect-error lala
                this.control.css("display", "block")
            },
        })
    }

    _inject(): void {
        const form = this.#mainElement.append("form").attr("id", this.#formId)

        // const formGroupA = form.append("div").attr("class", "form-group")
        const formGroupA = form
        const slider = formGroupA.append("div").attr("class", "text-center")
        slider.append("label").attr("for", this.#sliderId).text("Current in-game wind")
        slider.append("div").attr("id", this.#sliderId).attr("class", "rslider d-inline-block")
    }

    _getInputValue(): number {
        return this.#slider$.roundSlider("getValue")
    }

    /**
     * Get wind
     * @returns Wind in correctionValueDegrees
     */
    getWind(): number {
        const currentUserWind = degreesToCompass(this._getInputValue())
        let windDegrees: number

        if (Number.isNaN(Number(currentUserWind))) {
            windDegrees = compassToDegrees(currentUserWind)
        } else {
            windDegrees = Number(currentUserWind)
        }

        return windDegrees
    }
}
