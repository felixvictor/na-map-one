import { getIdFromBaseName } from "common/DOM"
import { formatInt, formatSignPercentOldstyle } from "common/format"
import { getCurrencyAmount } from "common/game-tools"
import { loadJsonFile } from "common/json"
import { getOrdinal } from "common/na-map-data/format"
import { getServerType, type ServerId, type ServerType } from "common/na-map-data/servers"
import { sortBy } from "common/na-map-data/sort"
import { select as d3Select } from "d3-selection"
import type { HtmlString } from "../../../@types/common"
import type { Module } from "../../../@types/na-map-data/modules"
import type { Recipe, RecipeEntity, RecipeGroup } from "../../../@types/na-map-data/recipes"
import { registerEvent } from "../../analytics"
import Modal from "../../components/modal"
import Select, { type SelectOptions } from "../../components/select"

const replacer = (match: string, p1: number, p2: number): string =>
    `${getOrdinal(p1)}\u202F\u2013\u202F${getOrdinal(p2)}`

export default class ListRecipes {
    readonly #baseId: HtmlString
    readonly #baseName = "List of admiralty items and recipes"
    readonly #menuId: HtmlString
    readonly #serverType: ServerType
    #modal: Modal | undefined = undefined
    #select = {} as Select
    #moduleData = [] as Module[]
    #recipeData = [] as RecipeGroup[]
    #recipes!: Map<number, RecipeEntity>

    constructor(serverId: ServerId) {
        this.#serverType = getServerType(serverId)
        this.#baseId = getIdFromBaseName(this.#baseName)
        this.#menuId = `menu-${this.#baseId}`

        this._setupListener()
    }

    async _loadAndSetupData(): Promise<void> {
        this.#moduleData = await loadJsonFile<Module[]>("modules")
        this.#recipeData = (await loadJsonFile<Recipe>("recipes")).recipe
        this.#recipes = new Map<number, RecipeEntity>(
            this.#recipeData.flatMap((group) => group.recipes.map((recipe: RecipeEntity) => [recipe.id, recipe])),
        )
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
        return this.#recipeData
            .map(
                (group) =>
                    `<optgroup label="${group.group}">${group.recipes
                        .filter(
                            (recipe) =>
                                recipe.serverType === -1 ||
                                recipe.serverType === "Any" ||
                                recipe.serverType === this.#serverType,
                        )
                        .sort(sortBy(["name"]))
                        .map(
                            (recipe: RecipeEntity) =>
                                `<option value="${recipe.id}">${recipe.name.replace(
                                    /(\d)-(\d)(st|rd|th)/,
                                    replacer,
                                )}</option>`,
                        )
                        .join("")}</optgroup>`,
            )
            .join("")
    }

    _setupSelect(): void {
        const selectOptions: Partial<SelectOptions> = {
            dropupAuto: false,
            liveSearch: true,
            placeholder: "Select item",
            virtualScroll: true,
            width: "fit",
        }

        this.#select = new Select(this.#baseId, this.#modal!.baseIdSelects, selectOptions, this._getOptions())

        d3Select(`#${this.#modal!.baseIdSelects} label`)
            .attr("class", "text-muted ps-2")
            .text("Items listed here may not be available in the game (yet).")
    }

    _setupSelectListener(): void {
        this.#select.select$.on("change", () => {
            this._recipeSelected()
        })
    }

    /**
     * Get recipe data by id
     * @param selectedRecipeId - Selected recipe
     */
    _getRecipeData(selectedRecipeId: number): RecipeEntity {
        return this.#recipes.get(selectedRecipeId)!
    }

    _getRequirementText(currentRecipe: RecipeEntity): HtmlString {
        let text = '<table class="table table-sm table-hover text-table"><tbody>'

        if (currentRecipe.goldPrice) {
            text += `<tr><td>${getCurrencyAmount(currentRecipe.goldPrice)}</td></tr>`
        }

        if (currentRecipe.itemRequirements.length > 0) {
            text += `${currentRecipe.itemRequirements
                .map((requirement) => `<tr><td>${requirement.amount} ${requirement.name}</td></tr>`)
                .join("")}`
        }

        text += "</tbody></table>"

        return text
    }

    _getPropertiesText(currentRecipe: RecipeEntity): HtmlString {
        let text = ""
        let moduleType = ""
        let properties = ""

        for (const type of this.#moduleData) {
            const modules = type[1].filter((module) => module.id === currentRecipe.result.id)
            for (const module of modules) {
                ;[moduleType] = type
                properties = `<tr><td>${module.properties
                    ?.map((property) => {
                        const amount = property.isPercentage
                            ? formatSignPercentOldstyle(property.amount / 100)
                            : property.amount
                        return `${property.modifier} ${amount}`
                    })
                    .join("</td></tr><tr><td>")}</td></tr>`
            }
        }

        if (properties) {
            text += `<h6 class="card-subtitle mb-2 text-muted">${moduleType}</h6>`
            text += `<table class="table table-sm table-hover text-table"><tbody>${properties}</tbody></table>`
        } else {
            text += `<p>${formatInt(currentRecipe.result.amount)} ${currentRecipe.result.name}</p>`
        }

        return text
    }

    /**
     * Construct recipe tables
     * @param selectedRecipeId - Selected recipe
     */
    _getText(selectedRecipeId: number): HtmlString {
        const currentRecipe = this._getRecipeData(selectedRecipeId)

        let text = '<div class="card-group">'

        text += '<div class="card"><div class="card-body">'
        text += '<h5 class="card-title">Item</h5>'
        text += this._getRequirementText(currentRecipe)
        text += "</div></div>"

        text += '<div class="card"><div class="card-body">'
        text += '<h5 class="card-title">Result</h5>'
        text += this._getPropertiesText(currentRecipe)
        text += "</div></div>"

        text += "</div></div>"
        return text
    }

    /**
     * Show recipes for selected recipe type
     */
    _recipeSelected(): void {
        const recipeId = Number(this.#select.getValues())
        const div = this.#modal!.outputSel

        // Remove old recipe list
        div.select("div").remove()

        // Add new recipe list
        div.append("div").classed("mt-4", true).html(this._getText(recipeId))
    }
}
