import { nations } from "common/na-map-data/nation"
import type { Nation } from "../@types/na-map-data/nations"

/**
 * Find Nation object based on nation short name
 */
export const findNationByNationShortName = (nationShortName: string): Nation | undefined =>
    nations.find((nation) => nation.short === nationShortName)

export const validNationShortName = (nationShortName: string): boolean =>
    nations.some((nation) => nation.short === nationShortName)
