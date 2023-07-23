export interface FlagEntity {
    [index: string]: number | string
    expire: string
    number: number
}
export interface FlagsPerNation {
    [index: string]: number | FlagEntity[]
    nation: number
    flags: FlagEntity[]
}
