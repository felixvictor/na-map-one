import { naMapData } from "../src/js/common/constants"

interface Repair {
    percent: number
    time: number
    volume: number
}
export type RepairList = Record<string, Repair>

export const getRepairList = async (): Promise<RepairList | undefined> => {
    const res = await fetch(`${naMapData.href}/repairs.json`)
    if (res.ok) {
        return await res.json()
    }
    return undefined
}
