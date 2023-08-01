import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
dayjs.extend(utc)

import Cookie from "../../components/cookie"
import { getNextServerStart } from "common/na-map-data/time"
import { degreesPerSecond } from "common/constants"
import type { HtmlString } from "../../../@types/common"

export default class WindRoseCookie {
    readonly #baseId: HtmlString
    readonly #cookieTime: Cookie
    readonly #cookieWindDegrees: Cookie

    constructor(id: HtmlString) {
        this.#baseId = id

        /**
         * Wind degree cookie
         */
        this.#cookieWindDegrees = new Cookie({
            id: `${this.#baseId}-degrees`,
            expire: this._getExpire(),
        })

        /**
         * Wind time cookie
         */
        this.#cookieTime = new Cookie({ id: `${this.#baseId}-time` })
    }

    _getExpire() {
        return getNextServerStart().toDate()
    }

    _getNow(): number {
        return dayjs().utc().unix()
    }

    get(): number {
        const cookieWind = this.#cookieWindDegrees.get()
        const cookieTime = this.#cookieTime.get()

        // If both cookies exist
        if (cookieWind && cookieTime) {
            const wind = Number(cookieWind)
            const time = Number(cookieTime)

            // Difference in seconds since wind has been stored
            const diffSeconds = Math.round(this._getNow() - time)

            return 360 + (Math.floor(wind - degreesPerSecond * diffSeconds) % 360)
        }

        // Remove cookies if none or only one of both cookies exists
        this.remove()

        return Number.NaN
    }

    /**
     * Store current wind and time in cookie
     */
    set(currentWindDegrees: number): void {
        this.#cookieWindDegrees.set(String(currentWindDegrees))
        this.#cookieTime.set(String(this._getNow()))
    }

    remove(): void {
        this.#cookieWindDegrees.remove()
        this.#cookieTime.remove()
    }
}
