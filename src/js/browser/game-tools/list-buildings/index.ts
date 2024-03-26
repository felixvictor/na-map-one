import type { Selection } from "d3-selection"

import { getIdFromBaseName } from "common/DOM"
import { formatInt } from "common/format"
import { getCurrencyAmount } from "common/game-tools"
import { loadJsonFile } from "common/json"
import { sortBy } from "common/na-map-data/sort"
import type { HtmlString } from "../../../@types/common"
import type { Building, BuildingResult } from "../../../@types/na-map-data/buildings"
import { registerEvent } from "../../analytics"
import Modal from "../../components/modal"
import Select, { type SelectOptions } from "../../components/select"

export default class ListBuildings {
    readonly #baseId: HtmlString
    readonly #baseName = "List of buildings"
    readonly #menuId: HtmlString
    #buildingData = {} as Building[]
    #labelSel = {} as Selection<HTMLLabelElement, unknown, HTMLElement, unknown>
    #modal: Modal | undefined = undefined
    #select = {} as Select

    constructor() {
        this.#baseId = getIdFromBaseName(this.#baseName)
        this.#menuId = `menu-${this.#baseId}`

        this._setupListener()
    }

    async _loadAndSetupData(): Promise<void> {
        this.#buildingData = await loadJsonFile<Building[]>("buildings")
    }

    async _menuClicked(): Promise<void> {
        registerEvent("Tools", this.#baseName)

        if (this.#modal) {
            this.#modal.show()
        } else {
            await this._loadAndSetupData()
            this.#modal = new Modal(this.#baseName, "lg")
            this._setupSelect()
            this._setupSelectListener()
        }
    }

    _setupListener(): void {
        document.querySelector(`#${this.#menuId}`)?.addEventListener("click", () => {
            void this._menuClicked()
        })
    }

    _getOptions(): HtmlString {
        return `${this.#buildingData
            .sort(sortBy(["name"]))
            .map((building: Building): string => `<option value="${building.name}">${building.name}</option>;`)
            .join("")}`
    }

    _setupSelect(): void {
        const selectOptions: Partial<SelectOptions> = { placeholder: "Select building" }

        this.#select = new Select(this.#baseId, this.#modal!.baseIdSelects, selectOptions, this._getOptions(), false)
        this.#labelSel = this.#modal!.selectsSel.select("label")
        this.#labelSel.attr("class", "ps-2")
    }

    _setupSelectListener(): void {
        this.#select.select$.on("change", () => {
            this._buildingSelected()
        })
    }

    _getBuildingData(selectedBuildingName: string): Building {
        return this.#buildingData.find((building) => building.name === selectedBuildingName)!
    }

    _getProductText(currentBuilding: Building): string {
        let text = ""
        if (currentBuilding.result) {
            if (currentBuilding.result.length > 1) {
                this.#labelSel.text("")
                text += '<table class="table table-sm table-hover text-table"><tbody>'
                text += `${currentBuilding.result
                    .sort(sortBy(["name"]))
                    .map((result: BuildingResult) => `<tr><td>${result.name}</td></tr>`)
                    .join("")}`
                text += "</tbody></table>"
            } else {
                this.#labelSel.text(`produces ${currentBuilding.result[0].name}`)

                if (currentBuilding.result[0].price) {
                    text += '<table class="table table-sm table-hover text-table"><tbody>'
                    text += `<tr><td>${getCurrencyAmount(currentBuilding.result[0].price)} per unit</td></tr>`
                    if (currentBuilding.batch) {
                        text += `<tr><td>${currentBuilding.batch.labour} labour hour${
                            currentBuilding.batch.labour > 1 ? "s" : ""
                        } per unit</td></tr>`
                    }

                    text += "</tbody></table>"
                }
            }
        }

        return text
    }

    _getRequirementText(currentBuilding: Building): string {
        let text = ""

        text += '<table class="table table-sm table-hover"><thead>'

        if (currentBuilding.levels[0].materials.length > 0) {
            text += "<tr><th>Level</th><th>Level build materials</th><th>Build price (reales)</th></tr>"
            text += "</thead><tbody>"
            for (const level of currentBuilding.levels) {
                const i = currentBuilding.levels.indexOf(level)
                text += `<tr><td>${i + 1}</td><td>`
                text += level.materials.map((material) => `${formatInt(material.amount)} ${material.item}`).join("<br>")
                text += "</td>"
                text += `<td>${formatInt(level.price)}</td>`
                text += "</tr>"
            }
        } else {
            text +=
                "<tr><th>Level</th><th>Production</th><th>Labour<br>cost (%)</th><th>Storage</th><th>Build price<br>(reales)</th></tr>"
            text += "</thead><tbody>"
            for (const level of currentBuilding.levels) {
                const i = currentBuilding.levels.indexOf(level)
                text += `<tr><td>${i + 1}</td><td>${formatInt(level.production)}</td><td>${formatInt(
                    level.labourDiscount * -100,
                )}</td><td>${formatInt(level.maxStorage)}</td><td>${formatInt(level.price)}</td></tr>`
            }
        }

        text += "</tbody></table>"
        return text
    }

    /**
     * Construct building tables
     */
    _getText(selectedBuildingName: string): string {
        const currentBuilding = this._getBuildingData(selectedBuildingName)

        let text = '<div class="row no-gutters card-deck">'

        text += '<div class="card col-4">'
        text += '<div class="card-body">'
        text += this._getProductText(currentBuilding)
        text += "</div></div>"

        text += '<div class="card col-8">'
        text += '<div class="card-body">'
        text += this._getRequirementText(currentBuilding)
        text += "</div></div>"

        text += "</div>"
        return text
    }

    /**
     * Show buildings for selected building type
     */
    _buildingSelected(): void {
        const building = String(this.#select.getValues())
        const div = this.#modal!.outputSel

        // Remove old recipe list
        div.select("div").remove()

        // Add new recipe list
        div.append("div").classed("mt-4", true).html(this._getText(building))
    }
}
