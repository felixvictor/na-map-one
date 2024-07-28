declare module "@d3fc/d3fc-label-layout" {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface Strategy {}

    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    type Point = import("common/na-map-data/coordinates.js").Point
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    type Segment = import("js/browser/map/make-journey/index.js").Segment
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    type ArrayLike = import("d3-selection").ArrayLike<SVGSVGElement | SVGGElement>

    type SizeF = (d: Segment, i: number, nodes: (SVGSVGElement | SVGGElement)[] | ArrayLike) => Point
    type PositionF = (d: Segment) => Point
    type ValueF = (d: Segment) => string

    // eslint-disable-next-line @typescript-eslint/ban-types
    interface LayoutTextLabelF extends Function {
        padding: (padding: number) => LayoutTextLabelF
        value: (f: ValueF) => LayoutTextLabelF
    }
    // eslint-disable-next-line @typescript-eslint/ban-types
    interface LayoutLabelF extends Function {
        size: (f: SizeF) => LayoutLabelF
        position: (f: PositionF) => LayoutLabelF
        component: (textLabel: LayoutTextLabelF) => LayoutLabelF
    }

    export function layoutTextLabel(): LayoutTextLabelF
    export function layoutAnnealing(): Strategy
    export function layoutLabel(strategy: Strategy): LayoutLabelF
}
