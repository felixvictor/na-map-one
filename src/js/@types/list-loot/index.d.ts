declare module "list-loot" {
    import type { LootAmount, LootChestsEntity, LootLootEntity } from "js/@types/na-map-data/loot.js"

    interface SourceDetail {
        id: number
        name: string
        chance: number
        amount: LootAmount
    }

    type LootData = {
        chest: LootChestsEntity[]
        fish: LootLootEntity[]
        loot: LootLootEntity[]
    }

    type LootItem = { name: string; sources: Map<number, SourceDetail> }
    type LootItemMap = Map<number, LootItem>
}
