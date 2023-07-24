import { loadJsonFile } from "../src/js/common/json"

interface Repair {
    percent: number
    time: number
    volume: number
}
export type RepairList = Record<string, Repair>

export const getRepairList = async () => {
    return loadJsonFile<RepairList>("repairs")
}
