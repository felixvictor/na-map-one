import { nations } from "common/na-map-data/nation"
import { simpleStringSort, sortBy } from "common/na-map-data/sort"
import { validNationShortName } from "common/nation"
import type { HtmlString } from "../../../@types/common"
import type { Nation } from "../../../@types/na-map-data/nations"
import { registerEvent } from "../../analytics"
import Select, { type SelectOptions } from "../../components/select"
import type DisplayPorts from "../display-ports"

export default class SelectPortsNationClan {
    #selectClan = {} as Select
    #selectClanButton = {} as HTMLButtonElement
    #selectNation = {} as Select
    #ports: DisplayPorts
    readonly #baseIdClan = "port-select-clan"
    readonly #baseIdNation = "port-select-nation"

    constructor(ports: DisplayPorts) {
        this.#ports = ports

        this._setupSelects()
        this._setupListener()
    }

    _capsOn(): void {
        this.#selectClanButton.classList.add("caps")
    }

    _capsOff(): void {
        this.#selectClanButton.classList.remove("caps")
    }

    _getNationOptions = (neutralPortsIncluded = true): HtmlString =>
        nations
            // Exclude neutral nation and free towns when neutralPortsIncluded is set
            .filter((nation) => !(!neutralPortsIncluded && (nation.short === "FT" || nation.short === "NT")))
            .sort(sortBy(["name"]))
            .map(
                (nation: Nation): string =>
                    `<option data-icon="flag-icon-${nation.short} flag-icon-small" value="${nation.short}">${nation.name}</option>`,
            )
            .join("")

    _setupNationSelect(): void {
        const selectOptions: Partial<SelectOptions> = {
            dropupAuto: false,
            liveSearch: false,
            virtualScroll: true,
        }
        const options = this._getNationOptions(true)
        this.#selectNation = new Select(this.#baseIdNation, undefined, selectOptions, options)
    }

    _getClanOptions(): HtmlString {
        const clanList = new Set<string>()
        for (const d of this.#ports.portData.filter((d) => d.capturer)) {
            clanList.add(d.capturer!)
        }

        if (clanList.size > 0) {
            return [...clanList]
                .sort(simpleStringSort)
                .map((clan) => `<option value="${clan}" class="caps">${clan}</option>`)
                .join("")
        }

        return ""
    }

    _setupClanSelect(): void {
        const selectOptions: Partial<SelectOptions> = {
            dropupAuto: false,
            liveSearch: false,
            virtualScroll: true,
        }
        const options = this._getClanOptions()

        this.#selectClan = new Select(this.#baseIdClan, undefined, selectOptions, options)
        this.#selectClanButton = this.#selectClan.select$
            .get(0)
            ?.parentNode?.querySelector("button") as HTMLButtonElement
    }

    _setupSelects(): void {
        this._setupNationSelect()
        this._setupClanSelect()
    }

    _clanSelected(): void {
        const clanSelected = String(this.#selectClan.getValues())

        this._capsOn()
        if (clanSelected) {
            this.#ports.portData = this.#ports.portDataDefault.filter((port) => port.capturer === clanSelected)
        }

        this.#ports.showRadius = ""
        this.#ports.update()
    }

    _clanRefresh(): void {
        const options = this._getClanOptions()

        this._capsOff()
        this.#selectClan.setSelectOptions(options)
        this.#selectClan.reset()

        if (options === "") {
            this.#selectClan.disable()
        } else {
            this.#selectClan.enable()
        }
    }

    _nationSelected(): void {
        const nationSelected = String(this.#selectNation.getValues())

        if (validNationShortName(nationSelected)) {
            this.#ports.portData = this.#ports.portDataDefault.filter((port) => port.nation === nationSelected)
            this.#ports.showRadius = ""
            this.#ports.update()
        }
    }

    _setupListener(): void {
        this.#selectClan.select$.on("change", () => {
            registerEvent("Menu", this.#baseIdNation)

            Select.resetAllExcept([this.#selectClan.select$, this.#selectNation.select$])
            this._clanSelected()
        })
        this.#selectNation.select$.on("change", () => {
            registerEvent("Menu", this.#baseIdClan)

            Select.resetAllExcept([this.#selectClan.select$, this.#selectNation.select$])
            this._nationSelected()
            this._clanRefresh()
        })
    }

    refreshSelect(): void {
        this.#selectNation.reset()
        this._clanRefresh()
    }
}
