export interface Recipe {
    recipe: RecipeGroup[]
    ingredient: RecipeIngredientEntity[]
}
interface RecipeGroup {
    group: string
    recipes: RecipeEntity[]
}
interface RecipeEntity {
    id: number
    name: string
    module: string
    labourPrice: number
    goldPrice: number
    itemRequirements: RecipeItemRequirement[]
    result: RecipeResult
    craftGroup?: string
    serverType: number | string
}
interface RecipeItemRequirement {
    name: string
    amount: number
}
interface RecipeResult {
    id: number
    name: string
    amount: number
}
interface RecipeIngredientEntity {
    id: number
    name: string
    recipeNames: string[]
}
