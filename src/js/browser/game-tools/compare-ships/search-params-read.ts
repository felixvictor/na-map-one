import type { ModuleType, SelectedId, ShipColumnTypeList } from "compare-ships"
import { woodType } from "../../../@types/na-map-data/constants"
import { shipColumnType } from "./index"
import { ShipCompareSearchParams } from "./search-params"

export class ShipCompareSearchParamsRead extends ShipCompareSearchParams {
    #selectedIds = {} as ShipColumnTypeList<SelectedId>

    getSelectedIds(moduleTypes: Set<ModuleType>): ShipColumnTypeList<SelectedId> {
        super.moduleTypes = moduleTypes

        this._getShipsAndWoods()
        this._getModules()

        return this.#selectedIds
    }

    _getShipsAndWoods(): void {
        const ids = super.getShipsAndWoodIds()
        let i = 0

        shipColumnType.some((columnId) => {
            this.#selectedIds[columnId] = {} as SelectedId
            this.#selectedIds[columnId].ship = ids[i]
            this.#selectedIds[columnId].wood = new Map([
                [woodType[0], ids[i + 1]],
                [woodType[1], ids[i + 2]],
            ])
            this.#selectedIds[columnId].modules = new Map<string, number[]>()
            i += 3
            return i >= ids.length
        })
    }

    _getModules(): void {
        for (const [keys, codedValue] of super.searchParams.entries()) {
            const [columnIndex, moduleTypeIndex] = [...keys]
            const value = ShipCompareSearchParams.getDecodedValue(codedValue)
            const columnId = this._getColumnId(Number(columnIndex))
            const moduleType = this._getModuleType(Number(moduleTypeIndex))

            this.#selectedIds[columnId].modules.set(moduleType, value)
        }
    }

    _getColumnId(columnTypeIndex: number): string {
        return [...Object.keys(this.#selectedIds)][columnTypeIndex]
    }

    _getModuleType(moduleTypeIndex: number): string {
        return [...super.moduleTypes][moduleTypeIndex]
    }
}
