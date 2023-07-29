import Cookies, { type CookieAttributes } from "js-cookie"
import dayjs from "dayjs"
import { appName } from "common/constants"

const yearInDays = 365

/**
 * Cookie
 */
export default class Cookie {
    // Cookie base id
    readonly #baseId: string
    // Expire (number = days or Date)
    readonly #expire: number | Date
    // Cookie name
    readonly #name: string
    // Possible cookie values
    readonly #values: readonly string[]
    // Default cookie value
    readonly #default: string
    readonly #tokenOptionsLocal: CookieAttributes = {
        path: "/",
        sameSite: "strict",
        httpOnly: false,
    }
    readonly #tokenOptionsSecure: CookieAttributes = {
        ...this.#tokenOptionsLocal,
        secure: true,
    }
    readonly #tokenOptions: CookieAttributes =
        window.location.hostname === "localhost" ? this.#tokenOptionsLocal : this.#tokenOptionsSecure

    constructor({ id: baseId, values = [], expire }: { id: string; values?: readonly string[]; expire?: dayjs.Dayjs }) {
        this.#baseId = baseId
        this.#expire = expire ? dayjs(expire).toDate() : yearInDays
        this.#name = `${appName}--${this.#baseId}`

        this.#values = values
        this.#default = values?.[0]
    }

    /**
     * Set cookie
     */
    set(cookieValue: string): void {
        console.log("cookie", this.#name, cookieValue, this.#default)
        // Set cookie if not default value
        if (cookieValue === this.#default) {
            // Else remove cookie
            this.remove()
        } else {
            Cookies.set(this.#name, cookieValue, {
                ...this.#tokenOptions,
                expires: this.#expire,
            })
        }
    }

    /**
     * Get cookie
     */
    get(): string {
        let cookieValue = Cookies.get(this.#name) ?? this.#default

        if (this.#default && cookieValue && !this.#values.includes(cookieValue)) {
            // Use default value if cookie has invalid data and remove cookie
            cookieValue = this.#default
            this.remove()
        }

        return cookieValue
    }

    /**
     * Remove cookie
     */
    remove(): void {
        Cookies.remove(this.#name)
    }
}
