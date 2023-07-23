export const sleep = async (ms: number): Promise<NodeJS.Timeout> => {
    // eslint-disable-next-line no-promise-executor-return
    return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * {@link https://stackoverflow.com/a/43593634}
 */
export class TupleKeyMap<K, V> extends Map {
    private readonly map = new Map<string, V>()

    set(key: K, value: V): this {
        this.map.set(JSON.stringify(key), value)
        return this
    }

    get(key: K): V | undefined {
        return this.map.get(JSON.stringify(key))
    }

    clear(): void {
        this.map.clear()
    }

    delete(key: K): boolean {
        return this.map.delete(JSON.stringify(key))
    }

    has(key: K): boolean {
        return this.map.has(JSON.stringify(key))
    }

    get size(): number {
        return this.map.size
    }

    forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: unknown): void {
        for (const [key, value] of this.map.entries()) {
            callbackfn.call(thisArg, value, JSON.parse(key) as K, this)
        }
    }
}
