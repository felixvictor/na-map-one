import { naMapData } from "./url"

class FetchError extends Error {
    private readonly response: Response
    constructor(response: Response) {
        super(`${response.url} ${response.statusText} (status ${response.status})`)
        this.name = "Fetch error"
        this.response = response
    }
}

export const loadJsonFile = async <T>(fileName: string): Promise<T> => {
    const response = await fetch(`${naMapData.href}/${fileName}.json`)

    if (response.ok) {
        return (await response.json()) as T
    }
    throw new FetchError(response)
}
