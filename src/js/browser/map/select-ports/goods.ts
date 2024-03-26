import { getIdFromBaseName } from "common/DOM"
import type { HtmlString } from "../../../@types/common"
import type { GoodList, PortPerServer, PortWithTrades } from "../../../@types/na-map-data/ports"
import { registerEvent } from "../../analytics"
import Select from "../../components/select"
import DisplayPorts from "../display-ports"

export default class SelectPortsSelectGoods {
    #baseName = "Show goods’ relations"
    #baseId: HtmlString
    #ports: DisplayPorts
    #select = {} as Select

    constructor(ports: DisplayPorts) {
        this.#ports = ports

        this.#baseId = `port-select-${getIdFromBaseName(this.#baseName)}`

        this._setupSelect()
        this._setupListener()
    }

    _getOptions(): HtmlString {
        const selectGoods = new Map<number, string>()
        const types = ["consumesTrading", "dropsTrading", "dropsNonTrading", "producesNonTrading"] as (keyof PortPerServer)[]

        for (const port of this.#ports.portDataDefault) {
            for (const type of types) {
                const goodList = port[type] as GoodList
                if (goodList) {
                    for (const good of goodList) {
                        selectGoods.set(good, this.#ports.portIcons.getTradeItem(good)?.name ?? "")
                    }
                }
            }
        }

        const sortedGoods = [...selectGoods].sort((a, b) => a[1].localeCompare(b[1]))

        return `${sortedGoods.map((good) => `<option value="${good[0]}">${good[1]}</option>`).join("")}`
    }

    _setupSelect(): void {
        this.#select = new Select(this.#baseId, undefined, {}, "")
    }

    _setupListener(): void {
        this.#select.select$.one("show.bs.select", () => {
            this.#select.setSelectOptions(this._getOptions())
            this.#select.reset()
        })
        this.#select.select$.on("change", () => {
            registerEvent("Menu", this.#baseName)

            Select.resetAllExcept([this.#select.select$])
            this._selectSelected()
        })
    }

    _selectSelected(): void {
        const goodSelectedId = Number(this.#select.getValues())

        const sourcePorts = (
            JSON.parse(
                JSON.stringify(
                    this.#ports.portDataDefault.filter(
                        (port) =>
                            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
                            port.dropsTrading?.includes(goodSelectedId) ||
                            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
                            port.dropsNonTrading?.includes(goodSelectedId) ||
                            port.producesNonTrading?.includes(goodSelectedId),
                    ),
                ),
            ) as PortWithTrades[]
        ).map((port) => {
            port.isSource = true
            return port
        })
        const consumingPorts = (
            JSON.parse(
                JSON.stringify(
                    this.#ports.portDataDefault.filter((port) => port.consumesTrading?.includes(goodSelectedId)),
                ),
            ) as PortWithTrades[]
        ).map((port) => {
            port.isSource = false
            return port
        })

        this.#ports.setShowRadiusSetting("off")
        this.#ports.portData = [...sourcePorts, ...consumingPorts]
        this.#ports.showRadius = "currentGood"
        this.#ports.update()
    }
}
