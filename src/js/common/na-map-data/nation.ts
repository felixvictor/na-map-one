import { nationMap } from "../../@types/na-map-data/constants"
import type { Nation } from "../../@types/na-map-data/nations"

/**
 * Find Nation object based on nation id
 */
export const findNationById = (nationId: number): Nation | undefined => nationMap.get(nationId)
