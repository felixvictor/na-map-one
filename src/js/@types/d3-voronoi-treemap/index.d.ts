declare module "d3-voronoi-treemap" {
    import seedrandom from "seedrandom"
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
        prng: (prng?: number | seedrandom.prng) => VoronoiTreemapF
    }

    export function voronoiTreemap(): VoronoiTreemapF
}
