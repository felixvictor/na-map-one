import { isEmpty } from "common/na-map-data/common"
import type { ModuleType, ModuleTypeList, ShipColumnTypeList } from "compare-ships"
import type { WoodColumnTypeList, WoodTypeList } from "compare-woods"
import type { HtmlString } from "../../../@types/common"
import { woodType } from "../../../@types/na-map-data/constants"
import type { WoodType } from "../../../@types/na-map-data/woods"
import type { SelectOptions } from "../../components/select"
import Select from "../../components/select"
import type { WoodData } from "../compare-woods/data"
import type { ShipColumnType } from "./index"
import type CompareShipsModal from "./modal"

export class CompareShipsSelect {
    #columnsCompare: ShipColumnType[]
    #selectModule = {} as ShipColumnTypeList<ModuleTypeList<Select>>
    #selectShip = {} as ShipColumnTypeList<Select>
    #selectWood = {} as ShipColumnTypeList<WoodTypeList<Select>>
    readonly #columnIds: ShipColumnType[]
    readonly #modal: CompareShipsModal

    constructor(baseId: HtmlString, columnIds: ShipColumnType[], modal: CompareShipsModal) {
        this.#columnIds = columnIds
        this.#modal = modal

        this.#columnsCompare = this.#columnIds.slice(1)

        for (const columnId of this.#columnIds) {
            this.#selectModule[columnId] = {}
        }
    }

    getShip$ = (columnId: ShipColumnType): JQuery<HTMLSelectElement> => this.#selectShip[columnId].select$

    getWood$ = (columnId: ShipColumnType, woodType: WoodType): JQuery<HTMLSelectElement> =>
        this.#selectWood[columnId][woodType].select$

    getModule$ = (columnId: ShipColumnType, moduleType: ModuleType): JQuery<HTMLSelectElement> =>
        this.#selectModule[columnId][moduleType].select$

    hasModuleSelects = (columnId: ShipColumnType): boolean => !isEmpty(this.#selectModule[columnId])

    setShip(columnId: ShipColumnType, shipId: number): void {
        this.#selectShip[columnId].setSelectValues(shipId)
        if (columnId === "base") {
            this.enableShipCompareSelects()
        }
    }

    setWood(columnId: ShipColumnType, woodType: WoodType, woodId: number): void {
        this.#selectWood[columnId][woodType].setSelectValues(woodId)
    }

    setWoods(columnId: ShipColumnType, woodIds: Map<string, number>): void {
        for (const [woodType, woodId] of woodIds) {
            this.setWood(columnId, woodType, woodId)
            this.enableWoodSelects(columnId)
        }
    }

    setModulesPerType(columnId: ShipColumnType, moduleType: ModuleType, ids: number[]): void {
        this.#selectModule[columnId][moduleType].setSelectValues(ids)
    }

    setModules(columnId: ShipColumnType, moduleIds: Map<string, number[]>): void {
        for (const [moduleType, ids] of moduleIds) {
            this.setModulesPerType(columnId, moduleType, ids)
        }
    }

    getSelectedShipId = (columnId: ShipColumnType): number => Number(this.#selectShip[columnId].getValues())

    getSelectedWoodId = (columnId: ShipColumnType, woodType: WoodType): number =>
        Number(this.#selectWood[columnId][woodType].getValues())

    getSelectedWoodIds(columnId: ShipColumnType): Map<string, number> {
        const woodIds = new Map<string, number>()

        for (const type of woodType) {
            const id = this.getSelectedWoodId(columnId, type)
            woodIds.set(type, id)
        }

        return woodIds
    }

    getSelectedModuleIds(columnId: ShipColumnType, moduleTypes: Set<ModuleType>): Map<string, number[]> {
        const moduleIds = new Map<string, number[]>()

        for (const type of moduleTypes) {
            const ids = this.getSelectedModuleIdsPerType(columnId, type)
            moduleIds.set(type, ids)
        }

        return moduleIds
    }

    resetWoodSelect(columnId: ShipColumnType, woodType: WoodType, woodId: number): void {
        this.#selectWood[columnId][woodType].setSelectValues(woodId)
    }

    enableWoodSelects(columnId: ShipColumnType): void {
        for (const type of woodType) {
            this.#selectWood[columnId][type].enable()
        }
    }

    enableShipSelect(columnId: ShipColumnType): void {
        this.#selectShip[columnId].enable()
    }

    enableShipCompareSelects(): void {
        for (const compareId of this.#columnsCompare) {
            this.enableShipSelect(compareId)
        }
    }

    getSelectedModuleIdsPerType(columnId: ShipColumnType, type: ModuleType): number[] {
        return Select.getSelectValueAsNumberArray(this.#selectModule[columnId][type].getValues())
    }

    initModuleSelects(columnId: string, moduleType: ModuleType, options: HtmlString): void {
        const divBaseId = this.#modal.getBaseId(columnId)
        const selectOptions: Partial<SelectOptions> = {
            actionsBox: true,
            countSelectedText(amount: number) {
                return `${amount} ${moduleType.toLowerCase()}s selected`
            },
            deselectAllText: "Clear",
            liveSearch: true,
            maxOptions: moduleType.startsWith("Ship trim") ? 6 : 5,
            selectedTextFormat: "count > 1",
            placeholder: moduleType,
            width: "170px",
        }

        this.#selectModule[columnId][moduleType] = new Select(
            `${divBaseId}-${moduleType.replace(/\s/, "")}`,
            this.#modal.getBaseIdSelects(columnId),
            selectOptions,
            options,
            true,
        )
    }

    _initShipSelect(columnId: string, divBaseId: string, shipOptions: HtmlString): void {
        const divSelectsShipId = this.#modal.getBaseIdSelectsShip(columnId)

        this.#selectShip[columnId] = new Select(
            `${divBaseId}-ship`,
            divSelectsShipId,
            { placeholder: "Ship" },
            shipOptions,
        )
        if (columnId !== "base") {
            this.#selectShip[columnId].disable()
        }
    }

    _initWoodSelects(columnId: string, divBaseId: string, woodData: WoodData): void {
        const divSelectsWoodsId = this.#modal.getBaseIdSelects(columnId)
        this.#selectWood[columnId] = {} as WoodColumnTypeList<Select>

        for (const type of woodType) {
            this.#selectWood[columnId][type] = new Select(
                `${divBaseId}-${type}`,
                divSelectsWoodsId,
                { placeholder: `Wood ${type}`, width: "170px" },
                woodData.getOptions(type),
            )
            this.#selectWood[columnId][type].disable()
        }
    }

    initShipAndWoodSelects(shipOptions: HtmlString, woodData: WoodData): void {
        for (const columnId of this.#columnIds) {
            const divBaseId = this.#modal.getBaseId(columnId)
            this._initShipSelect(columnId, divBaseId, shipOptions)
            this._initWoodSelects(columnId, divBaseId, woodData)
        }
    }
}
