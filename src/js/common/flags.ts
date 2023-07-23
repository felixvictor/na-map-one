import { findNationByNationShortName } from "common/nation"
import type { NationListAlternative } from "../@types/na-map-data/nations"

/**
 * {@link https://stackoverflow.com/questions/42118296/dynamically-import-images-from-a-directory-using-webpack}
 * @param r - webpack require.context
 * @returns Images
 */
const importAll = (r: __WebpackModuleApi.RequireContext): NationListAlternative<string> => {
    const images = {} as NationListAlternative<string>
    for (const item of r.keys()) {
        const index = item.replace("./", "").replace(".svg", "")
        images[index] = r(item) as string
    }

    // Sort by nation
    const sortedImages = Object.fromEntries(
        Object.entries(images).sort(
            ([nation1], [nation2]) =>
                findNationByNationShortName(nation1)!.id - findNationByNationShortName(nation2)!.id,
        ),
    )
    return sortedImages
}

const getIcons = (): NationListAlternative<string> => {
    return importAll((require as __WebpackModuleApi.RequireFunction).context("../../images/flags", false, /\.svg$/))
}

export const nationFlags = getIcons()
