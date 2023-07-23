type Id = string
type Ids = Array<Id>

/**
 * RadioButton
 */
export default class RadioButton {
    // Radio button name
    readonly #name: string
    // Radio button ids
    readonly #ids: Ids
    // Default checked radio button id
    readonly #default: Id

    constructor(name: string, ids: Ids) {
        this.#name = name.replace(/ /g, "")
        this.#ids = ids
        ;[this.#default] = ids
    }

    /**
     * Set radio button
     */
    set(id: Id): void {
        ;((document.querySelector(`#${this.#name}-${id}`) ?? {}) as HTMLInputElement).checked = true
    }

    /**
     * Get radio button value
     */
    get(): Id {
        // Radio button value
        let { value } = (document.querySelector(`input[name="${this.#name}"]:checked`) ?? {}) as HTMLInputElement

        if (typeof value === "undefined" || !this.#ids.includes(value)) {
            // Use default value if radio button does not exist or has invalid data
            value = this.#default
            this.set(value)
        }

        return value
    }
}
