import { select as d3Select, type Selection } from "d3-selection"
import { line as d3Line, type Line } from "d3-shape"

import { getIdFromBaseName } from "common/DOM"
import { degreesPerSecond } from "common/constants"
import { degreesToRadians } from "common/na-map-data/coordinates"
import type { HtmlString } from "../../../@types/common"
import { registerEvent } from "../../analytics"
import { printSmallCompassRose } from "../../util"
import WindRoseCookie from "./cookie"
import WindRoseModal from "./modal"

export default class WindRose {
    #div!: Selection<HTMLDivElement, unknown, HTMLElement, unknown>
    #modal: WindRoseModal | undefined = undefined
    #svg = {} as Selection<SVGSVGElement, unknown, HTMLElement, unknown>
    #windPath: Selection<SVGPathElement, unknown, HTMLElement, unknown> | undefined = undefined
    #portSummarySel = d3Select("#port-summary")

    readonly #baseId: HtmlString
    readonly #baseName = "In-game wind"

    #compassRadius!: number
    #currentWindDegrees: number
    #height!: number
    #intervalId!: number
    #length!: number
    #width!: number
    #xCompass!: number
    #yCompass!: number
    readonly #arrowId = "wind-arrow"
    readonly #arrowWidth = 4
    readonly #cookie: WindRoseCookie
    readonly #intervalSeconds: number
    readonly #line: Line<[number, number]>
    readonly #menuId: HtmlString

    constructor() {
        this.#baseId = getIdFromBaseName(this.#baseName)
        this.#menuId = `menu-${this.#baseId}`

        this.#line = d3Line()
            .x((d) => d[0])
            .y((d) => d[1])

        this.#intervalSeconds = 40

        /**
         * Get current wind from cookie or use default value
         */
        this.#cookie = new WindRoseCookie(this.#baseId)
        this.#currentWindDegrees = this.#cookie.get()

        this._setupArrow()
        this._setupListener()
        if (!Number.isNaN(this.#currentWindDegrees)) {
            this._initShowCurrentWind()
        }
    }

    _menuClicked(): void {
        registerEvent("Menu", this.#baseName)

        if (this.#modal) {
            this.#modal.show()
        } else {
            this.#modal = new WindRoseModal(this.#baseName)
            this.#modal.getModalNode().addEventListener("hidden.bs.modal", () => {
                this._useUserInput()
            })
        }
    }

    _setupArrow(): void {
        const width = this.#arrowWidth
        const doubleWidth = this.#arrowWidth * 2

        d3Select("#na-svg defs")
            .append("marker")
            .attr("id", this.#arrowId)
            .attr("viewBox", `0 -${width} ${doubleWidth} ${doubleWidth}`)
            .attr("refX", width)
            .attr("refY", 0)
            .attr("markerWidth", width)
            .attr("markerHeight", width)
            .attr("orient", "auto")
            .append("path")
            .attr("class", "fill-contrast-text")
            .attr("d", `M0,-${width}L${doubleWidth},0L0,${width}`)
    }

    _setupListener(): void {
        document.querySelector(`#${this.#menuId}`)?.addEventListener("click", () => {
            this._menuClicked()
        })
    }

    _windChange(): void {
        this.#currentWindDegrees = 360 + ((this.#currentWindDegrees - degreesPerSecond * this.#intervalSeconds) % 360)

        this._updateWindDirection()
    }

    _useUserInput(): void {
        this.#currentWindDegrees = this.#modal!.getWind()

        if (this.#windPath) {
            this._updateWindDirection()
        } else {
            this._initShowCurrentWind()
        }
    }

    _toggle(show: boolean): void {
        this.#portSummarySel.classed("port-summary-no-wind", !show).classed("port-summary-wind", show)
    }

    _show(): void {
        this._toggle(true)
    }

    _hide(): void {
        this._toggle(false)
    }

    _setupSvg(): void {
        this._show()

        this.#div = this.#portSummarySel
            .insert("div", ":first-child")
            .attr("id", this.#baseId)
            .attr("class", "block p-0 pe-2")
        this.#svg = this.#div.append("svg").attr("class", "small svg-background-light stroke-thick")
    }

    _initShowCurrentWind(): void {
        this._setupSvg()
        this._initPrintCompassRose()
        this._updateWindDirection()
        this.#intervalId = window.setInterval(() => {
            this._windChange()
        }, this.#intervalSeconds * 1000)
    }

    _updateWindDirection(): void {
        const radians = degreesToRadians(this.#currentWindDegrees)
        const dx = this.#length * Math.cos(radians)
        const dy = this.#length * Math.sin(radians)
        const lineData = [
            [Math.round(this.#xCompass + dx), Math.round(this.#yCompass + dy)],
            [Math.round(this.#xCompass - dx), Math.round(this.#yCompass - dy)],
        ] as [number, number][]
        if (this.#windPath) {
            this.#windPath.datum(lineData).attr("d", this.#line)
            this.#cookie.set(this.#currentWindDegrees)
        }
    }

    _getHeight(): number {
        const div = document.querySelector<HTMLDivElement>("#port-summary .block")
        if (div) {
            const { height, top } = div.getBoundingClientRect()
            const paddingTop = Number.parseFloat(window.getComputedStyle(div).getPropertyValue("padding-top"))
            const paddingBottom = Number.parseFloat(window.getComputedStyle(div).getPropertyValue("padding-bottom"))

            return Math.floor(height - top - paddingTop - paddingBottom)
        }

        return 0
    }

    _initPrintCompassRose(): void {
        this.#height = this._getHeight()
        this.#yCompass = this.#height / 2
        this.#width = this.#height
        this.#xCompass = this.#width / 2
        this.#compassRadius = Math.min(this.#height, this.#width) / 2
        this.#length = this.#compassRadius * 0.6

        this.#svg.attr("height", this.#height).attr("width", this.#width)

        // Compass rose
        const compassElement = this.#svg
            .append("svg")
            .attr("ui-component", "compass")
            .attr("class", "fill-background-light")
            .attr("x", this.#xCompass)
            .attr("y", this.#yCompass)
        printSmallCompassRose({ element: compassElement, radius: this.#compassRadius })

        this.#windPath = this.#svg
            .append("path")
            .attr("class", "svg-stroke-thick")
            .attr("marker-end", "url(#wind-arrow)")
    }

    clearMap(): void {
        window.clearInterval(this.#intervalId)
        this._hide()
        if (this.#div) {
            this.#div.remove()
        }

        this.#windPath = undefined
        this.#cookie.remove()
    }
}
