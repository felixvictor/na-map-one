import { getIdFromBaseName } from "common/DOM"
import { circleRadiusFactor } from "common/constants"
import { convertInvCoordX, convertInvCoordY } from "common/na-map-data/coordinates"
import type { HtmlString } from "../../../@types/common"
import { registerEvent } from "../../analytics"
import Toast from "../../components/toast"
import { trilaterate, type Vector } from "../../components/transliterate"
import { copyF11ToClipboard } from "../../util"
import DisplayPorts from "../display-ports"
import GetPositionModal from "./modal"

/**
 * Get position
 */
export default class TrilateratePosition {
    readonly #baseId: HtmlString
    readonly #baseName = "Get position"
    readonly #menuId: HtmlString
    readonly #roundingFactor = 1.04

    #modal: GetPositionModal | undefined = undefined
    #ports: DisplayPorts

    /**
     * @param ports - Port data
     */
    constructor(ports: DisplayPorts) {
        this.#ports = ports

        this.#baseId = getIdFromBaseName(this.#baseName)
        this.#menuId = `menu-${this.#baseId}`

        this._setupListener()
    }

    _menuClicked(): void {
        registerEvent("Menu", this.#baseName)

        if (this.#modal) {
            this.#modal.show()
        } else {
            this.#modal = new GetPositionModal(this.#baseName, this.#ports.portDataDefault)
            this.#modal.getModalNode().addEventListener("hidden.bs.modal", () => {
                this._useUserInput()
            })
        }
    }

    /**
     * Setup menu item listener
     */
    _setupListener(): void {
        document.querySelector(`#${this.#menuId}`)?.addEventListener("click", () => {
            this._menuClicked()
        })
    }

    /**
     * Show and go to Position
     */
    _showAndGoToPosition(): void {
        const circles = this.#ports.portData.map((port) => ({
            x: port.coordinates[0],
            y: port.coordinates[1],
            z: 0,
            r: port.distance ?? 0,
        }))

        const position = trilaterate(circles[0], circles[1], circles[2], true) as Vector

        // If intersection is found
        if (position) {
            position.x = Math.round(position.x)
            position.y = Math.round(position.y)

            this.#ports.map.f11.printCoord(position.x, position.y)
            this.#ports.map.zoomAndPan(position.x, position.y)

            const coordX = Math.round(convertInvCoordX(position.x, position.y) / -1000)
            const coordY = Math.round(convertInvCoordY(position.x, position.y) / -1000)
            copyF11ToClipboard(coordX, coordY, this.#modal!.getModalNode())

            void new Toast(this.#baseName, "Coordinates copied to clipboard.")
        } else {
            void new Toast(this.#baseName, "No intersection found.")
        }
    }

    /**
     * Use user input and show position
     */
    _useUserInput(): void {
        /*
        const ports = new Map([
            ["Gracias a Dios", 52 * roundingFactor * circleRadiusFactor],
            ["Port Morant", 296 * roundingFactor * circleRadiusFactor],
            ["Santanillas", 82 * roundingFactor * circleRadiusFactor],
        ])
        */

        const ports = new Map<string, number>()
        for (const id of this.#modal!.ids) {
            const port = this.#modal!.getPort(id)
            const distance = this.#modal!.getDistance(id)

            if (distance && port !== "") {
                ports.set(port, distance * this.#roundingFactor * circleRadiusFactor)
            }
        }

        if (ports.size === this.#modal!.numberOfInputs) {
            this.#ports.setShowRadiusSetting("position")
            this.#ports.portData = this.#ports.portDataDefault
                .filter((port) => ports.has(port.name))
                .map((port) => {
                    port.distance = ports.get(port.name)
                    return port
                })
            this.#ports.update()
            this._showAndGoToPosition()
        } else {
            void new Toast(this.#baseName, "Not enough data.")
        }
    }
}
