import type { ModuleType, SelectedId, ShipColumnTypeList } from "compare-ships"
import { shipColumnType } from "./index"
import { ShipCompareSearchParams } from "./search-params"

export class ShipCompareSearchParamsWrite extends ShipCompareSearchParams {
    #selectedIds: ShipColumnTypeList<SelectedId>

    constructor(selectedIds: ShipColumnTypeList<SelectedId>, moduleTypes: Set<ModuleType>) {
        super()

        super.moduleTypes = moduleTypes
        this.#selectedIds = selectedIds

        this._addVersion()
        this._addShipsAndWoods()
        this._addModules()
    }

    getSearchParam(): string {
        return super.getUrl()
    }

    _addVersion(): void {
        super.setVersion()
    }

    // Add selected ships and woods, triple (shipId, frameId, trimId) per column, flat array
    _addShipsAndWoods(): void {
        let ids = [] as number[]

        for (const columnId of shipColumnType) {
            if (this.#selectedIds[columnId]) {
                ids = [...ids, this.#selectedIds[columnId].ship, ...this.#selectedIds[columnId].wood.values()]
            }
        }

        super.setShipsAndWoodIds(ids)
    }

    // Add selected setModules, new searchParam per module
    _addModules(): void {
        for (const [columnIndex, columnId] of shipColumnType.entries()) {
            if (this.#selectedIds[columnId]) {
                for (const [moduleTypeIndex, moduleType] of [...super.moduleTypes].entries()) {
                    const value = this.#selectedIds[columnId].modules.get(moduleType) ?? []
                    if (value.length > 0) {
                        super.setModuleIds(columnIndex, moduleTypeIndex, value)
                    }
                }
            }
        }
    }
}
