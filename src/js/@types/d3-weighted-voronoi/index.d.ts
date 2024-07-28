declare module "d3-weighted-voronoi" {
    import type { ClippingPolygon } from "d3-voronoi-treemap"
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    type Point = import("common/na-map-data/coordinates.js").Point
    type ConflictList = undefined

    interface Vertex {
        x: number
        y: number
        weight: number
        index: number
        conflicts: ConflictList
        neighbours: null
        nonClippedPolygon: null
        polygon: ClippingPolygon
        originalObject: null
        isDummy: boolean
    }
}
