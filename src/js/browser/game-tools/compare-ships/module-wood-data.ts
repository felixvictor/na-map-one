import type { AbsoluteAndPercentageAmount, Amount } from "compare-ships"
import type { WoodTypeList } from "compare-woods"
import type { HtmlString } from "../../../@types/common"
import type { ModifierName, ModuleEntity, ModulePropertiesEntity } from "../../../@types/na-map-data/modules"
import type { ShipData } from "../../../@types/na-map-data/ships"
import type { WoodTrimOrFrame } from "../../../@types/na-map-data/woods"
import type { ShipColumnType } from "./index"
import { moduleAndWoodCaps, moduleAndWoodChanges } from "./module-modifier"

export default class ModulesAndWoodData {
    #baseData = {} as ShipData
    #baseId: HtmlString
    #data = {} as ShipData
    #maxSpeed: number
    #minSpeed: number
    #modifierAmount = {} as Map<ModifierName, AbsoluteAndPercentageAmount>
    readonly #moduleAndWoodChanges = moduleAndWoodChanges
    readonly #moduleAndWoodCaps = moduleAndWoodCaps
    readonly #doNotRound = new Set(["Turn acceleration"]) // Integer values that should not be rounded when modifiers are applied

    constructor(id: HtmlString, minSpeed: number, maxSpeed: number) {
        this.#baseId = id
        this.#minSpeed = minSpeed
        this.#maxSpeed = maxSpeed
    }

    static _adjustAbsolute(currentValue: number, additionalValue: number): number {
        return currentValue ? currentValue + additionalValue : additionalValue
    }

    static _adjustPercentage(currentValue: number, additionalValue: number, isBaseValueAbsolute: boolean): number {
        if (isBaseValueAbsolute) {
            return currentValue ? currentValue * (1 + additionalValue) : additionalValue
        }

        return currentValue ? currentValue + additionalValue : additionalValue
    }

    _getCappingId(columnId: ShipColumnType): HtmlString {
        return `${this.#baseId}-${columnId}-capping`
    }

    _setModifier(property: ModulePropertiesEntity): void {
        let absolute = property.isPercentage ? 0 : property.amount
        let percentage = property.isPercentage ? property.amount : 0

        // If modifier has been in the Map add the amount
        if (this.#modifierAmount.has(property.modifier)) {
            absolute += this.#modifierAmount.get(property.modifier)?.absolute ?? 0
            percentage += this.#modifierAmount.get(property.modifier)?.percentage ?? 0
        }

        this.#modifierAmount.set(property.modifier, {
            absolute,
            percentage,
        })
    }

    _roundPropertyValue(baseValue: number, value: number, doNotRound = false): number {
        if (Number.isInteger(baseValue) && !doNotRound) {
            return Math.round(value)
        }

        return Math.trunc(value * 100) / 100
    }

    _adjustValue(value: number, key: string, isBaseValueAbsolute: boolean): number {
        let adjustedValue = value

        if (this.#modifierAmount.get(key)?.percentage !== 0) {
            const percentage = this.#modifierAmount.get(key)!.percentage / 100
            adjustedValue = ModulesAndWoodData._adjustPercentage(adjustedValue, percentage, isBaseValueAbsolute)
        }

        if (this.#modifierAmount.get(key)?.absolute !== 0) {
            const { absolute } = this.#modifierAmount.get(key)!
            adjustedValue = ModulesAndWoodData._adjustAbsolute(adjustedValue, absolute)
        }

        const doNotRound = this.#doNotRound.has(key) || isBaseValueAbsolute || value === 0

        return this._roundPropertyValue(value, adjustedValue, doNotRound)
    }

    _showCappingAdvice(compareId: ShipColumnType, modifiers: Set<string>): void {
        const id = this._getCappingId(compareId)
        let div = document.querySelector<HTMLDivElement>(`#${id}`)

        if (!div) {
            div = document.createElement("p")
            div.id = id
            div.className = "alert alert-warning"
            const element = document.querySelector<HTMLDivElement>(`#${this.#baseId}-${compareId}`)
            element?.firstChild?.after(div)
        }

        // noinspection InnerHTMLJS
        div.innerHTML = `${[...modifiers].join(", ")} capped`
    }

    _removeCappingAdvice(compareId: ShipColumnType): void {
        const id = this._getCappingId(compareId)
        const div = document.querySelector<HTMLDivElement>(`#${id}`)

        if (div) {
            div.remove()
        }
    }

    _setModifierAmountWoods(woodData: WoodTypeList<WoodTrimOrFrame>): void {
        // Add modifier amount for both frame and trim
        for (const [, woodProperties] of Object.entries(woodData)) {
            for (const property of woodProperties.properties ?? []) {
                // console.log("_setModifierAmountWoods", property)
                if (this.#moduleAndWoodChanges.has(property.modifier)) {
                    this._setModifier(property)
                }
            }
        }
    }

    _setModifierAmountModules(moduleData: ModuleEntity[]): void {
        for (const module of moduleData) {
            for (const property of module.properties ?? []) {
                // console.log("_setModifierAmountModules", property)
                if (this.#moduleAndWoodChanges.has(property.modifier)) {
                    this._setModifier(property)
                }
            }
        }
    }

    _adjustDataByModifiers(): void {
        for (const [key] of this.#modifierAmount.entries()) {
            if (this.#moduleAndWoodChanges.get(key)?.properties) {
                const { properties, isBaseValueAbsolute } = this.#moduleAndWoodChanges.get(key)!
                for (const modifier of properties) {
                    const index = modifier.split(".")
                    if (index.length > 1) {
                        /*
                        console.log(
                            key,
                            this.#data[index[0]][index[1]],
                            this.#modifierAmount.get(key),
                            isBaseValueAbsolute,
                            this._adjustValue(this.#data[index[0]][index[1]], key, isBaseValueAbsolute)
                        )
                        */
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                        this.#data[index[0]][index[1]] = this._adjustValue(
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
                            this.#data[index[0]][index[1]],
                            key,
                            isBaseValueAbsolute,
                        )
                    } else {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                        this.#data[index[0]] = this._adjustValue(this.#data[index[0]], key, isBaseValueAbsolute)
                    }
                }
            }
        }
    }

    _adjustDataByCaps(columnId: ShipColumnType): void {
        const valueCapped = { isCapped: false, modifiers: new Set<ModifierName>() }

        const adjustValue = (
            modifier: ModifierName,
            valueUncapped: number,
            valueBase: number,
            { amount: capAmount, isPercentage }: Amount,
        ): number => {
            const valueRespectingCap = Math.min(
                valueUncapped,
                isPercentage ? this._roundPropertyValue(valueBase, valueBase * (1 + capAmount)) : capAmount,
            )
            if (valueUncapped > valueRespectingCap) {
                valueCapped.isCapped = true
                valueCapped.modifiers.add(modifier)
            }

            return valueRespectingCap
        }

        /* eslint-disable @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access */

        for (const [modifier] of this.#modifierAmount.entries()) {
            if (this.#moduleAndWoodCaps.has(modifier)) {
                const { cap } = this.#moduleAndWoodCaps.get(modifier)!
                for (const property of this.#moduleAndWoodCaps.get(modifier)!.properties) {
                    const index = property.split(".")
                    if (index.length > 1) {
                        if (this.#data[index[0]][index[1]]) {
                            this.#data[index[0]][index[1]] = adjustValue(
                                modifier,
                                this.#data[index[0]][index[1]],
                                this.#baseData[index[0]][index[1]],
                                cap,
                            )
                        }
                    } else if (this.#data[index[0]]) {
                        this.#data[index[0]] = adjustValue(
                            modifier,
                            this.#data[index[0]],
                            this.#baseData[index[0]],
                            cap,
                        )
                    }
                }
            }
        }

        /* eslint-enable @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access */

        if (valueCapped.isCapped) {
            this._showCappingAdvice(columnId, valueCapped.modifiers)
        } else {
            this._removeCappingAdvice(columnId)
        }
    }

    _setSpeedDegrees(): void {
        this.#data.speedDegrees = this.#data.speedDegrees.map((speed: number) => {
            const factor = 1 + this.#modifierAmount.get("Max speed")!.percentage / 100
            const newSpeed = speed > 0 ? speed * factor : speed / factor
            // Correct speed by caps
            return Math.max(Math.min(newSpeed, this.#maxSpeed), this.#minSpeed)
        })
    }

    // Add upgrade changes to ship this.#data

    addModulesAndWoodData(
        shipDataBase: ShipData,
        shipDataUpdated: ShipData,
        columnId: ShipColumnType,
        woodData: WoodTypeList<WoodTrimOrFrame>,
        moduleData: ModuleEntity[],
    ): ShipData {
        this.#baseData = shipDataBase
        this.#data = JSON.parse(JSON.stringify(shipDataUpdated)) as ShipData
        this.#modifierAmount = new Map()

        this._setModifierAmountWoods(woodData)
        this._setModifierAmountModules(moduleData)
        this._adjustDataByModifiers()
        this._adjustDataByCaps(columnId)
        if (this.#modifierAmount.has("Max speed")) {
            this._setSpeedDegrees()
        }

        return this.#data
    }
}
