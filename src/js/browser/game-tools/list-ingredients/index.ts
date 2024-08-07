import { default as BSTooltip } from "bootstrap/js/dist/tooltip"

import { getIdFromBaseName } from "common/DOM"
import { formatSignInt, formatSignPercentOldstyle } from "common/format"
import { loadJsonFile } from "common/json"
import { sortBy } from "common/na-map-data/sort"
import type { HtmlString } from "../../../@types/common"
import type { Module } from "../../../@types/na-map-data/modules"
import type { Recipe, RecipeIngredientEntity } from "../../../@types/na-map-data/recipes"
import { registerEvent } from "../../analytics"
import Modal from "../../components/modal"
import { chunkify } from "../../util"

export default class ListIngredients {
    #ingredientData = [] as RecipeIngredientEntity[]
    #modal: Modal | undefined = undefined
    #moduleData = [] as Module[]
    readonly #baseId: HtmlString
    readonly #baseName = "List of recipe ingredients"
    readonly #menuId: HtmlString

    constructor() {
        this.#baseId = getIdFromBaseName(this.#baseName)
        this.#menuId = `menu-${this.#baseId}`

        this._setupListener()
    }

    async _loadAndSetupData(): Promise<void> {
        this.#moduleData = await loadJsonFile<Module[]>("modules")
        this.#ingredientData = (await loadJsonFile<Recipe>("recipes")).ingredient
    }

    async _menuClicked(): Promise<void> {
        registerEvent("Tools", this.#baseName)

        if (this.#modal) {
            this.#modal.show()
        } else {
            await this._loadAndSetupData()
            this.#modal = new Modal(this.#baseName, "xl")
            this._ingredientListSelected()
        }
    }

    _setupListener(): void {
        document.querySelector(`#${this.#menuId}`)?.addEventListener("click", () => {
            void this._menuClicked()
        })
    }

    _getProperties(recipeName: string): HtmlString {
        let text: string
        let moduleType = ""
        let properties = ""
        for (const type of this.#moduleData) {
            const modules = type[1].sort(sortBy(["name"])).filter((module) => module.name === recipeName)
            for (const module of modules) {
                moduleType = type[0]

                properties = `${module.properties
                    ?.map((property) => {
                        const amount = property.isPercentage
                            ? formatSignPercentOldstyle(property.amount / 100).replace(/"/g, "'")
                            : formatSignInt(property.amount)
                        return `<tr><td class='text-start pe-3'>${property.modifier}</td><td>${amount}</td></tr>`
                    })
                    .join("")}`
            }
        }

        text = `<h6 class='text-muted'>${moduleType}</h6>`
        text += `<table class='table table-striped w-auto'><tbody>${properties}</tbody></table>`

        return properties ? text : ""
    }

    _getRows(): HtmlString[] {
        return this.#ingredientData.map(
            (ingredient) =>
                `<tr><td>${ingredient.name}</td><td>${ingredient.recipeNames
                    .map((recipeName) => {
                        const properties = this._getProperties(recipeName)

                        return properties
                            ? `<a data-bs-toggle="tooltip" title="${properties}">${recipeName}</a>`
                            : recipeName
                    })
                    .join("<br>")}</td></tr>`,
        )
    }

    /**
     * Construct ingredient tables
     */
    _getText(): HtmlString {
        const columns = 2
        const rows = this._getRows()
        const splitRows = chunkify(rows, columns)
        let text = ""

        for (const column of Array.from({ length: splitRows.length }).keys()) {
            text += `<div class="col-md-${Math.floor(12 / splitRows.length)}">`
            text += '<table class="table table-sm table-striped table-hover text-table text-start"><thead>'
            text += "<tr><th>Ingredient</th><th>Recipes</th></tr></thead><tbody>"
            text += splitRows[column].join("")
            text += "</tbody></table></div>"
        }

        return text
    }

    _ingredientListSelected(): void {
        const div = this.#modal!.outputSel

        div.select("div").remove()
        div.append("div").attr("class", "row").html(this._getText())

        const tooltipTriggerList = Array.prototype.slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
        tooltipTriggerList.map(function (tooltipTriggerEl: HTMLElement) {
            return new BSTooltip(tooltipTriggerEl, {
                html: true,
                placement: "auto",
                sanitize: false,
            })
        })
    }
}
