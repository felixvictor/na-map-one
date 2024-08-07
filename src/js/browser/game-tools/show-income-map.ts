/*!
 * This file is part of na-map.
 *
 * @file      Income map.
 * @module    game-tools/show-income-map
 * @author    iB aka Felix Victor
 * @copyright Felix Victor 2017 to 2022
 * @license   http://www.gnu.org/licenses/gpl.html
 */

import { default as BSTooltip } from "bootstrap/js/dist/tooltip"

import { max as d3Max, min as d3Min } from "d3-array"
import { hierarchy as d3Hierarchy, stratify as d3Stratify, type HierarchyNode } from "d3-hierarchy"
import type { ScaleLinear } from "d3-scale"
import { scaleLinear as d3ScaleLinear, scaleOrdinal as d3ScaleOrdinal, type ScaleOrdinal } from "d3-scale"
import type { Selection } from "d3-selection"
import { voronoiTreemap as d3VoronoiTreemap, type Point } from "d3-voronoi-treemap"
import type { Vertex } from "d3-weighted-voronoi"
import seedrandom from "seedrandom"

import { getIdFromBaseName, showCursorDefault, showCursorWait } from "common/DOM"
import { formatPercentSig, formatSiCurrency, formatSiInt } from "common/format"
import { getContrastColour } from "common/game-tools"
import { loadJsonFile } from "common/json"
import { ϕ } from "common/na-map-data/constants"
import { nations } from "common/na-map-data/nation"
import type { ServerId } from "common/na-map-data/servers"
import type { HtmlString, PortIncome, PortJsonData } from "../../@types/common"
import type { PortBasic, PortBattlePerServer, PortPerServer } from "../../@types/na-map-data/ports"
import { registerEvent } from "../analytics"
import Modal from "../components/modal"

interface TreeMapPolygon extends Array<Point> {
    0: Point
    1: Point
    2: Point
    3: Point
    site: Vertex
}
interface TreeMapHierarchyNode<T> extends HierarchyNode<T> {
    polygon: TreeMapPolygon
}

type PortHierarchyId = string | undefined
interface PortHierarchy {
    id: PortHierarchyId
    value: number
    parentId: PortHierarchyId
}

/**
 *
 */
export default class ShowIncomeMap {
    #fontScale = {} as ScaleLinear<number, number>
    #height = 0
    #mainDiv = {} as Selection<HTMLDivElement, unknown, HTMLElement, unknown>
    #mainG = {} as Selection<SVGGElement, unknown, HTMLElement, unknown>
    #modal: Modal | undefined = undefined
    #nestedData = {} as HierarchyNode<PortHierarchy>
    #serverId: ServerId
    #svg = {} as Selection<SVGSVGElement, unknown, HTMLElement, unknown>
    #tooltip: BSTooltip | undefined = undefined
    #tree = {} as TreeMapHierarchyNode<HierarchyNode<PortHierarchy>>
    #width = 0
    readonly #baseId: HtmlString
    readonly #baseName = "Net income"
    readonly #colourScale: ScaleOrdinal<string, string>
    readonly #menuId: HtmlString

    constructor(serverId: ServerId) {
        this.#serverId = serverId

        this.#baseId = `show-${getIdFromBaseName(this.#baseName)}`
        this.#menuId = `menu-${this.#baseId}`

        this.#colourScale = d3ScaleOrdinal<string, string>()
            .domain(nations.map((nation) => nation.short))
            .range(nations.map((nation) => nation.colours[0]))

        this._setupListener()
    }

    /**
     * Get <factor> height of current window
     */
    static getHeight(): number {
        const factor = 0.75
        return top ? Math.floor(top.innerHeight * factor) : 0
    }

    /**
     * Get width of baseId
     */
    _getWidth(): number {
        return Math.floor(this.#mainDiv.node()!.offsetWidth) ?? 0
    }

    _setupData(data: PortJsonData): void {
        const minFontSize = 8
        const maxFontSize = 32

        // Combine port data with port battle data
        const portData = data.ports.map((port: PortBasic) => {
            const serverData = data.server.find((d: PortPerServer) => d.id === port.id) ?? ({} as PortPerServer)
            const pbData = data.pb.find((d: PortBattlePerServer) => d.id === port.id) ?? ({} as PortBattlePerServer)
            const combinedData = { ...port, ...serverData, ...pbData } as PortIncome

            return combinedData
        })

        const minIncome = d3Min(portData, (d) => d.netIncome) ?? 0
        const maxIncome = d3Max(portData, (d) => d.netIncome) ?? 0
        this.#fontScale = d3ScaleLinear().domain([minIncome, maxIncome]).range([minFontSize, maxFontSize]).clamp(true)

        const nationWithoutIncomeData = new Set(["NT", "FT"])
        const nationWithIncome = new Set()

        const flatData: PortHierarchy[] = [
            // Port leaves
            ...portData
                .filter((port) => port.netIncome > 0 && !nationWithoutIncomeData.has(port.nation))
                .map((port) => {
                    nationWithIncome.add(port.nation)
                    return {
                        id: port.name,
                        value: port.netIncome,
                        parentId: port.nation,
                    }
                }),
            // Nation nodes
            ...nations
                .filter((nation) => nationWithIncome.has(nation.short))
                .map((nation) => ({
                    id: nation.short,
                    value: 0,
                    parentId: "World",
                })),
            // Root node
            { id: "World", value: 0, parentId: undefined },
        ]

        this.#nestedData = d3Stratify<PortHierarchy>()(flatData)
        this.#tree = d3Hierarchy(this.#nestedData).sum(
            (d: HierarchyNode<PortHierarchy>) => d.data.value,
        ) as TreeMapHierarchyNode<HierarchyNode<PortHierarchy>>
    }

    async _loadData(): Promise<PortJsonData> {
        const readData = {} as PortJsonData

        readData.ports = await loadJsonFile<PortBasic[]>("ports")
        readData.server = await loadJsonFile<PortPerServer[]>(`${this.#serverId}-ports`)
        readData.pb = await loadJsonFile<PortBattlePerServer[]>(`${this.#serverId}-pb`)

        return readData
    }

    async _loadAndSetupData(): Promise<void> {
        showCursorWait()
        const readData = await this._loadData()
        this._setupData(readData)
        showCursorDefault()
    }

    async _menuClicked(): Promise<void> {
        registerEvent("Tools", this.#baseName)

        if (this.#modal) {
            this.#modal.show()
        } else {
            await this._loadAndSetupData()
            this.#modal = new Modal(this.#baseName, "xl")
            this.#mainDiv = this.#modal.outputSel
            this._initTreemap()
            this._drawTreemap()
        }
    }

    _setupListener(): void {
        document.querySelector(`#${this.#menuId}`)?.addEventListener("click", () => {
            void this._menuClicked()
        })
    }

    _drawLegend(): void {
        const rowHeight = Math.floor(20 * ϕ)
        const iconHeight = rowHeight * 0.8
        const rowPadding = Math.floor(2 * ϕ)
        const columnPadding = Math.floor(5 * ϕ)
        const nations = (this.#tree.children ?? []).sort((a, b) => b.value! - a.value!)

        const minColumnWidth = 160 + columnPadding * 2 // Width of "Verenigde Provinciën" plus padding
        const totalWidth = nations.length * minColumnWidth - columnPadding * 2
        const rows = Math.ceil(totalWidth / this.#width)
        const columnsPerRow = Math.ceil(nations.length / rows)
        const columnWidth = Math.ceil(this.#width / columnsPerRow - columnPadding * 2)
        const legendContainer = this.#mainDiv
            .append("div")
            .attr("class", "d-flex flex-wrap justify-content-between mt-3")

        legendContainer
            .selectAll(".legend")
            .data(nations)
            .join((enter) => {
                const div = enter.append("div").attr("class", "legend mt-3")

                const svg = div
                    .append("svg")
                    .attr("width", columnWidth)
                    .attr("height", rowHeight * 2 + rowPadding)

                svg.append("rect")
                    .attr("width", columnWidth)
                    .attr("height", rowHeight)
                    .style("fill", (d) => this.#colourScale(d.data.id!))

                svg.append("rect")
                    .attr("x", columnPadding)
                    .attr("y", "5%")
                    .attr("width", (iconHeight * 4) / 3)
                    .attr("height", iconHeight)
                    .attr("fill", (d) => `url(#${d.data.id!})`)

                svg.append("text")
                    .attr("x", columnWidth - columnPadding)
                    .attr("y", "25%")
                    .text((d) => d.data.id!)
                    .attr("class", "text-end")
                    .style("fill", (d) => getContrastColour(this.#colourScale(d.data.id!)))

                svg.append("rect")
                    .attr("class", "opacity-low")
                    .attr("y", rowHeight + rowPadding)
                    .attr("width", columnWidth)
                    .attr("height", rowHeight)
                    .style("fill", (d) => this.#colourScale(d.data.id!))

                svg.append("rect")
                    .attr("y", rowHeight + rowPadding)
                    .attr("width", (d) => columnWidth * (d.value! / (d.parent?.value ?? 1)))
                    .attr("height", rowHeight)
                    .style("fill", (d) => this.#colourScale(d.data.id!))

                svg.append("text")
                    .attr("x", columnWidth - columnPadding)
                    .attr("y", "75%")
                    .html((d) => formatSiInt(d.value!, true))
                    .style("text-anchor", "end")

                return div
            })
    }

    _getTooltipText(d: TreeMapHierarchyNode<HierarchyNode<PortHierarchy>>): HtmlString {
        return `
            <div class="d-flex justify-content-between align-items-center">
            <div class="d-flex flex-column text-start mt-1 me-3 p-0">
                <div><i class="flag-icon-${
                    d.parent?.data.id
                } flag-icon-small me-2" role="img"></i><span class="x-large">${d.data.id ?? ""}</span></div>
            </div>
            <div class="d-flex flex-column text-start mt-1 p-0">
                <div class="me-3">
                    ${formatSiInt(d.data.data.value)}<br />
                    <span class="des">Port</span>
                </div>
                <div class="me-3">
                    ${formatPercentSig(d.data.data.value / (d.parent?.value ?? 1))}<br />
                    <span class="des">Nation</span>
                </div>
                <div class="me-3">
                    ${formatPercentSig(d.data.data.value / (d.parent?.parent?.value ?? 1))}<br />
                    <span class="des">World</span>
                </div>
            </div>
            </div>`
    }

    _hideDetails(): void {
        if (this.#tooltip !== undefined) {
            this.#tooltip.dispose()
            this.#tooltip = undefined
        }
    }

    _showDetails(event: Event, d: TreeMapHierarchyNode<HierarchyNode<PortHierarchy>>): void {
        const element = event.currentTarget as Element

        this._hideDetails()
        this.#tooltip = new BSTooltip(element, {
            html: true,
            template:
                '<div class="tooltip  bs-tooltip-top" role="tooltip">' +
                '<div class="tooltip-block tooltip-inner tooltip-inner-smaller">' +
                "</div></div>",
            title: this._getTooltipText(d),
            trigger: "manual",
            sanitize: false,
        })
        this.#tooltip.show()
    }

    _drawCells(leaves: TreeMapHierarchyNode<HierarchyNode<PortHierarchy>>[]): void {
        this.#mainG
            .append("g")
            .attr("class", "cells")
            .selectAll(".cell")
            .data(leaves)
            .join((enter) =>
                enter
                    .append("path")
                    .attr("class", "cell")
                    .attr("d", (d) => `M${d.polygon.join(",")}z`)
                    .style("fill", (d) => this.#colourScale(d.parent?.data.id ?? "")),
            )
    }

    _drawLabels(leaves: TreeMapHierarchyNode<HierarchyNode<PortHierarchy>>[]): void {
        const labels = this.#mainG
            .append("g")
            .attr("class", "labels")
            .selectAll(".label")
            .data(leaves)
            .join((enter) =>
                enter
                    .append("g")
                    .attr("class", "label")
                    .attr("transform", (d) => `translate(${d.polygon.site.x},${d.polygon.site.y})`)
                    .style("font-size", (d) => `${this.#fontScale(d.data.data.value)}px`)
                    .style("fill", (d) => getContrastColour(this.#colourScale(d.parent?.data.id ?? ""))),
            )
        labels
            .append("text")
            .attr("class", "name")
            .text((d) => d.data.data.id!)
        labels
            .append("text")
            .attr("class", "value")
            .html((d) => formatSiCurrency(d.data.data.value, true))
    }

    _drawHover(leaves: TreeMapHierarchyNode<HierarchyNode<PortHierarchy>>[]): void {
        this.#mainG
            .append("g")
            .selectAll(".hoverer")
            .data(leaves)
            .join((enter) =>
                enter
                    .append("path")
                    .attr("class", "hoverer")
                    .attr("d", (d) => {
                        return `M${d.polygon.join(",")}z`
                    })
                    .on("mouseover", (event: Event, d) => {
                        this._showDetails(event, d)
                    })
                    .on("mouseleave", () => {
                        this._hideDetails()
                    }),
            )
    }

    _drawTreemap(): void {
        const leaves = this.#tree.leaves()

        this._drawCells(leaves)
        this._drawLabels(leaves)
        this._drawHover(leaves)

        this._drawLegend()
    }

    _initTreemap(): void {
        this.#height = ShowIncomeMap.getHeight()
        this.#width = this._getWidth()

        this.#svg = this.#mainDiv
            .append("svg")
            .attr("class", "voronoi")
            .attr("width", this.#width)
            .attr("height", this.#height)
        this.#mainG = this.#svg.append("g").attr("class", "drawingArea")

        d3VoronoiTreemap()
            .clip([
                [0, 0],
                [0, this.#height],
                [this.#width, this.#height],
                [this.#width, 0],
            ])
            .minWeightRatio(1e-10)
            .prng(seedrandom(this.#baseId))(this.#tree)
    }
}
