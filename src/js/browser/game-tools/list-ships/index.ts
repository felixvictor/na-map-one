import type { Selection } from "d3-selection"

import { getIdFromBaseName } from "common/DOM"
import { formatFloatFixed, formatInt } from "common/format"
import { beautifyShipName } from "common/game-tools"
import { loadJsonFile } from "common/json"
import { maxShallowWaterBR } from "common/na-map-data/constants"
import { sortBy } from "common/na-map-data/sort"
import type { HeaderMap, HtmlString } from "../../../@types/common"
import type { ShipData } from "../../../@types/na-map-data/ships"
import { registerEvent } from "../../analytics"
import Modal from "../../components/modal"

type ShipListData = [number | string, string][]

/**
 *
 */
export default class ShipList {
    #modal: Modal | undefined = undefined
    #rows = {} as Selection<HTMLTableRowElement, ShipListData, HTMLTableSectionElement, unknown>
    #shipListData = [] as ShipListData[]
    #sortAscending = true
    #sortIndex = 0
    #table = {} as Selection<HTMLTableElement, unknown, HTMLElement, unknown>
    readonly #baseId: HtmlString
    readonly #baseName = "List of ships"
    readonly #menuId: HtmlString

    constructor() {
        this.#baseId = getIdFromBaseName(this.#baseName)
        this.#menuId = `menu-${this.#baseId}`

        this._setupListener()
    }

    async _loadAndSetupData(): Promise<void> {
        const shipData = (await loadJsonFile<ShipData[]>("ships")).sort(sortBy(["class", "-battleRating", "name"]))

        this.#shipListData = shipData.map(
            (ship: ShipData): ShipListData => [
                [ship.class, String(ship.class)],
                [
                    ship.name,
                    `${beautifyShipName(ship.name)} ${
                        ship.battleRating <= maxShallowWaterBR
                            ? '<i class="ps-2 icon icon-small icon-lighter icon-shallow" role="img" aria-label="Shallow"></i>'
                            : ""
                    }`,
                ],
                [ship.guns.total, String(ship.guns.total)],
                [ship.guns.damage.cannons, formatInt(ship.guns.damage.cannons)],
                [ship.battleRating, formatInt(ship.battleRating)],
                [ship.crew.max, formatInt(ship.crew.max)],
                [ship.speed.max, formatFloatFixed(ship.speed.max, 1)],
                [ship.ship.turnSpeed, formatFloatFixed(ship.ship.turnSpeed, 1)],
                [
                    ship.guns.gunsPerDeck[4].amount,
                    ship.guns.gunsPerDeck[4].amount ? String(ship.guns.gunsPerDeck[4].amount) : "",
                ],
                [
                    ship.guns.gunsPerDeck[5].amount,
                    ship.guns.gunsPerDeck[5].amount ? String(ship.guns.gunsPerDeck[5].amount) : "",
                ],
                [
                    ship.sides.armour,
                    `${formatInt(ship.sides.armour)} <span class="badge badge-highlight">${
                        ship.sides.thickness
                    }</span>`,
                ],
            ],
        )
    }

    async _menuClicked(): Promise<void> {
        registerEvent("Tools", this.#baseName)

        if (this.#modal) {
            this.#modal.show()
        } else {
            await this._loadAndSetupData()
            this.#modal = new Modal(this.#baseName, "lg")
            this._shipListSelected()
        }
    }

    _setupListener(): void {
        document.querySelector(`#${this.#menuId}`)?.addEventListener("click", () => {
            void this._menuClicked()
        })
    }

    _sortRows(index: number, changeOrder = true): void {
        if (changeOrder && this.#sortIndex === index) {
            this.#sortAscending = !this.#sortAscending
        }

        this.#sortIndex = index
        const sign = this.#sortAscending ? 1 : -1
        this.#rows.sort((a, b): number => {
            if (index === 1) {
                return (a[index][0] as string).localeCompare(b[index][0] as string) * sign
            }

            return ((a[index][0] as number) - (b[index][0] as number)) * sign
        })
    }

    _initTable(): void {
        const header: HeaderMap = {
            group: new Map([
                ["dummy1", 2],
                ["Guns", 2],
                ["dummy2", 2],
                ["Speed", 2],
                ["Chasers", 2],
                ["dummy3", 1],
            ]),
            element: new Set([
                "",
                "Name",
                "No.",
                "Damage",
                "<span class='caps'>br</span>",
                "Crew",
                "Max",
                "Turn",
                "Bow",
                "Stern",
                "Sides",
            ]),
        }

        const head = this.#table.append("thead")
        head.append("tr")
            .attr("class", "thead-group")
            .selectAll("th")
            .data([...header.group])
            .join("th")
            .classed("border-bottom-0", (d) => d[0].startsWith("dummy"))
            .classed("text-center", true)
            .attr("colspan", (d) => d[1])
            .attr("scope", "col")
            .text((d) => (d[0].startsWith("dummy") ? "" : d[0]))
        head.append("tr")
            .selectAll("th")
            .data([...header.element])
            .join("th")
            .datum((d, i) => ({ data: d, index: i }))
            .classed("text-start", (d, i) => i === 1)
            .classed("pe-1", (d, i) => i !== 1)
            .html((d) => d.data)
            .on("click", (_event, d) => {
                this._sortRows(d.index)
            })

        this.#table.append("tbody")
    }

    _updateTable(): void {
        // Data join rows
        this.#rows = this.#table
            .select<HTMLTableSectionElement>("tbody")
            .selectAll<HTMLTableRowElement, ShipListData>("tr")
            .data(this.#shipListData, (d: ShipListData): string => d[1][0] as string)
            .join((enter) => enter.append("tr"))

        // Data join cells
        this.#rows
            .selectAll<HTMLTableCellElement, string>("td")
            .data((row) => row)
            .join((enter) =>
                enter
                    .append("td")
                    .classed("pe-1", (d, i) => i !== 1)
                    .classed("text-start", (d, i) => i === 1)
                    .html((d) => d[1]),
            )
    }

    _shipListSelected(): void {
        this.#table = this.#modal!.outputSel.append("table").attr(
            "class",
            "table table-sm table-striped table-hover table-sort",
        )

        this._initTable()
        this._updateTable()
        this._sortRows(0, false)
    }
}
