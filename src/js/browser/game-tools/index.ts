import type { ServerId } from "common/na-map-data/servers"

import { checkShipCompareData } from "./compare-ships"
import ListBuildings from "./list-buildings"
import ListCannons from "./list-cannons"
import ListIngredients from "./list-ingredients"
import ListLoot from "./list-loot"
import ListModules from "./list-modules"
import ListRecipes from "./list-recipes"
import ListShipBlueprints from "./list-ship-blueprints"
import ListShips from "./list-ships"
import ListWoods from "./list-woods"

import type { ShipCompareSearchParamsRead } from "./compare-ships/search-params-read"
import { CompareWoods } from "./compare-woods"
import ShowIncomeMap from "./show-income-map"
import ShowPortOwnerships from "./show-port-ownerships"

/**
 * Init
 */
const init = (serverId: ServerId, readParams?: ShipCompareSearchParamsRead): void => {
    checkShipCompareData(readParams)

    void new CompareWoods()
    void new ListWoods()
    void new ListBuildings()
    void new ListCannons()
    void new ListIngredients()
    void new ListLoot()
    void new ListModules()
    void new ListRecipes(serverId)
    void new ListShips()
    void new ListShipBlueprints()

    void new ShowIncomeMap(serverId)
    void new ShowPortOwnerships(serverId)
}

export { init }
