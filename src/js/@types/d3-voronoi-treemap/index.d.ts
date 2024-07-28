declare module "d3-voronoi-treemap" {
    import type seedrandom from "seedrandom"
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    type Point = import("common/na-map-data/coordinates.js").Point

    interface ClippingPolygon {
        0: Point
        1: Point
        2: Point
        3: Point
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    interface VoronoiTreemapF extends Function {
        clip: (polygon: ClippingPolygon) => VoronoiTreemapF
        minWeightRatio: (ratio: number) => VoronoiTreemapF
        // @ts-expect-error case
        // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
        prng: (prng?: number | seedrandom.prng) => VoronoiTreemapF
    }

    export function voronoiTreemap(): VoronoiTreemapF
}
