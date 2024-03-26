import type { Selection } from "d3-selection"

import { getIdFromBaseName } from "common/DOM"
import { formatFloatFixed, formatPP } from "common/format"
import { loadJsonFile } from "common/json"
import { capitalizeFirstLetter } from "common/na-map-data/format"
import { simpleStringSort, sortBy } from "common/na-map-data/sort"
import type { WoodTypeList } from "compare-woods"
import type { HtmlString } from "../../../@types/common"
import { woodFamily, woodType } from "../../../@types/na-map-data/constants"
import type {
    WoodFamily,
    WoodJsonData,
    WoodProperty,
    WoodTrimOrFrame,
    WoodType,
} from "../../../@types/na-map-data/woods"
import { registerEvent } from "../../analytics"
import Modal from "../../components/modal"

/**
 *
 */
export default class ListWoods {
    #modal: Modal | undefined = undefined
    readonly #baseId: HtmlString
    readonly #baseName = "List of woods"
    readonly #checkboxId: HtmlString
    readonly #menuId: HtmlString

    private _modifiers = {} as WoodTypeList<Set<string>>
    private _rows = {} as WoodTypeList<
        Selection<HTMLTableRowElement, WoodTrimOrFrame, HTMLTableSectionElement, unknown>
    >

    private _sortAscending = {} as WoodTypeList<boolean>
    private _sortIndex = {} as WoodTypeList<number>
    private _switchesSel!: HTMLInputElement[]
    private _tables = {} as WoodTypeList<Selection<HTMLTableElement, unknown, HTMLElement, unknown>>

    private _woodData: WoodJsonData = {} as WoodJsonData
    private _woodDataDefault: WoodJsonData = {} as WoodJsonData
    private readonly _modifiersNotUsed = new Set(["Boarding morale", "Crew", "Morale", "Repair time", "Ship material"])

    constructor() {
        this.#baseId = getIdFromBaseName(this.#baseName)
        this.#menuId = `menu-${this.#baseId}`
        this.#checkboxId = `checkbox-${this.#baseId}`

        this._setupListener()
    }

    async _menuClicked(): Promise<void> {
        registerEvent("Tools", this.#baseName)

        if (this.#modal) {
            this.#modal.show()
        } else {
            await this._loadAndSetupData()
            this.#modal = new Modal(this.#baseName, "xl")
            this._injectBody()
            this._woodFamilySelected()
        }
    }

    _setupListener(): void {
        document.querySelector(`#${this.#menuId}`)?.addEventListener("click", () => {
            void this._menuClicked()
        })
    }

    _getModifiers(type: WoodType): string[] {
        const modifiers = new Set<string>()

        for (const wood of this._woodDataDefault[type]) {
            for (const property of wood.properties.filter(
                (property) => !this._modifiersNotUsed.has(property.modifier),
            )) {
                modifiers.add(property.modifier)
            }
        }

        return [...modifiers].sort(simpleStringSort)
    }

    async _loadData(): Promise<void> {
        this._woodDataDefault = await loadJsonFile<WoodJsonData>("woods")
    }

    _setupData(): void {
        for (const type of woodType) {
            this._modifiers[type] = new Set(this._getModifiers(type))
            for (const wood of this._woodDataDefault[type]) {
                const properties: WoodProperty[] = wood.properties
                    .filter((property) => !this._modifiersNotUsed.has(property.modifier))
                    .map((property) => property)
                const currentWoodModifiers = new Set(wood.properties.map((property) => property.modifier))
                for (const modifier of this._modifiers[type]) {
                    // Add missing properties to each wood
                    if (!currentWoodModifiers.has(modifier)) {
                        properties.push({
                            modifier,
                            amount: 0,
                            isPercentage: false,
                        } as WoodProperty)
                    }
                }

                properties.sort(sortBy(["modifier"]))
                wood.properties = [...properties]
            }
        }

        this._woodData = { ...this._woodDataDefault }
    }

    async _loadAndSetupData(): Promise<void> {
        await this._loadData()
        this._setupData()
    }

    _sortRows(type: WoodType, index: number, changeOrder = true): void {
        if (changeOrder && this._sortIndex[type] === index) {
            this._sortAscending[type] = !this._sortAscending[type]
        }

        this._sortIndex[type] = index
        const sign = this._sortAscending[type] ? 1 : -1

        this._rows[type].sort((a, b): number => {
            // Sort by wood name asc/desc
            if (index === 0) {
                return a.name.localeCompare(b.name) * sign
            }

            const aa = a.properties[index - 1].amount
            const bb = b.properties[index - 1].amount
            if (aa === bb) {
                // sort by wood name asc
                return a.name.localeCompare(b.name)
            }
            // Sort by value asc/desc
            return (aa - bb) * sign
        })
    }

    _initTable(type: WoodType): void {
        this._sortAscending[type] = true
        this._tables[type]
            .append("thead")
            .append("tr")
            .selectAll("th")
            .data(["Wood", ...this._modifiers[type]])
            .join("th")
            .datum((d, i) => ({ data: d, index: i }))
            .classed("text-start", (d, i) => i === 0)
            .attr("role", "columnheader")
            .html((d) => d.data.replace(" ", "<br>"))
            .on("click", (_event, d) => {
                this._sortRows(type, d.index)
            })
        this._tables[type].append("tbody")
    }

    _injectBody(): void {
        const div = this.#modal!.outputSel

        const divSwitches = div.append("div").attr("class", "mb-3")
        for (const family of woodFamily) {
            const divSwitch = divSwitches.append("div").attr("class", "form-check form-check-inline form-switch")
            divSwitch
                .append("input")
                .attr("id", `${this.#checkboxId}-${family}`)
                .attr("name", `${this.#checkboxId}`)
                .attr("class", "form-check-input")
                .attr("type", "checkbox")
                .property("checked", true)
            divSwitch
                .append("label")
                .attr("for", `${this.#checkboxId}-${family}`)
                .attr("class", "form-check-label")
                .text(capitalizeFirstLetter(family))
        }

        this._switchesSel = [...document.querySelectorAll<HTMLInputElement>(`input[name=${this.#checkboxId}]`)]
        for (const input of this._switchesSel) {
            input.addEventListener("change", (event: Event) => {
                event.preventDefault()
                this._woodFamilySelected()
            })
        }

        for (const type of woodType) {
            div.append("h5").text(capitalizeFirstLetter(`${type}s`))
            this._tables[type] = div
                .append("table")
                .attr("class", "table table-sm table-striped table-hover table-sort")
            this._initTable(type)
            this._updateTable(type)
            this._sortRows(type, 0, false)
        }
    }

    _getFormattedAmount(property: WoodProperty): HtmlString {
        let formattedAmount
        if (property.modifier === "Repair amount" && property.amount) {
            formattedAmount = formatPP(property.amount, 1)
        } else {
            formattedAmount = property.amount ? formatFloatFixed(property.amount) : ""
        }

        return formattedAmount
    }

    _updateTable(type: WoodType): void {
        // Data join rows
        this._rows[type] = this._tables[type]
            .select<HTMLTableSectionElement>("tbody")
            .selectAll<HTMLTableRowElement, WoodTrimOrFrame>("tr")
            .data(this._woodData[type], (d: WoodTrimOrFrame): number => d.id)
            .join((enter) => enter.append("tr"))

        // Data join cells
        this._rows[type]
            .selectAll<HTMLTableCellElement, string>("td")
            .data((row): string[] => {
                return [row.name, ...row.properties.map((property) => this._getFormattedAmount(property))]
            })
            .join((enter) =>
                enter
                    .append("td")
                    .classed("text-start", (d, i) => i === 0)
                    .html((d) => {
                        return d
                    }),
            )
    }

    _woodFamilySelected(): void {
        const activeFamilies = new Set<WoodFamily>()
        for (const input of this._switchesSel) {
            if (input.checked) {
                const family = input.id.replace(`${this.#checkboxId}-`, "")!
                activeFamilies.add(family)
            }
        }

        for (const type of woodType) {
            this._woodData[type] = this._woodDataDefault[type].filter((wood) => activeFamilies.has(wood.family))
            this._updateTable(type)
            this._sortRows(type, this._sortIndex[type], false)
        }
    }
}
