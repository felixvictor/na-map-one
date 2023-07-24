import { Point } from "common/na-map-data/coordinates"

export interface GeoJson {
    type: "FeatureCollection"
    features: FeaturesEntity[]
}
export interface FeaturesEntity {
    type: "Feature"
    id: string
    geometry: Geometry
}
export interface Geometry {
    type: "Point" | "Polygon"
    coordinates: Point[]
}
