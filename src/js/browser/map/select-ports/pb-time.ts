import { registerEvent } from "../../analytics"
import DisplayPorts from "../display-ports"
import Select, { type SelectOptions } from "util/select"
import { getPortBattleTime } from "common/time"
import type { HtmlString } from "../../../@types/common"

export default class SelectPBTimeWindow {
    #select = {} as Select
    #ports: DisplayPorts
    readonly #baseId = "port-select-pb-time"

    constructor(ports: DisplayPorts) {
        this.#ports = ports

        this._setupSelect()
        this._setupListener()
    }

    _getOptions(): HtmlString {
        const data = new Set<number>(
            this.#ports.portData
                .filter((port) => port.capturable)
                .map((port): number => port.portBattleStartTime)
                .sort((a, b) => a - b),
        )

        return `${[...data]
            .map((time): string => `<option value="${time}">${getPortBattleTime(time)}</option>`)
            .join("")}`
    }

    _setupSelect(): void {
        const selectOptions: Partial<SelectOptions> = {
            dropupAuto: false,
            liveSearch: false,
            virtualScroll: true,
        }

        this.#select = new Select(this.#baseId, undefined, selectOptions, this._getOptions())
    }

    _selected(): void {
        const timeSelected = String(this.#select.getValues())

        this.#ports.portData = this.#ports.portDataDefault.filter(
            (port) => port.capturable && port.portBattleStartTime === Number(timeSelected),
        )
        this.#ports.showRadius = ""
        this.#ports.update()
    }

    _setupListener(): void {
        this.#select.select$.on("change", async () => {
            registerEvent("Menu", this.#baseId)

            this._selected()
        })
    }
}
