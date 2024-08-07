import type { DragBehavior, DragContainerElement, SubjectPosition } from "d3-drag"
import { drag as d3Drag } from "d3-drag"
import type { ScaleLinear } from "d3-scale"
import { scaleLinear as d3ScaleLinear } from "d3-scale"
import type { Selection } from "d3-selection"
import {
    arc as d3Arc,
    curveCatmullRomClosed as d3CurveCatmullRomClosed,
    lineRadial as d3LineRadial,
    pie as d3Pie,
    type PieArcDatum,
} from "d3-shape"
import "d3-transition"

import { drawSvgCircle, drawSvgVLine, rotationAngleInDegrees } from "../../util"

import { Column } from "./column"
import type { ColumnCompare } from "./column-compare"
import type { CompareShips } from "./compare-ships"

import { segmentRadians } from "common/constants"
import { formatFloat, formatInt, formatSignFloat, formatSignInt, pluralise } from "common/format"
import { hullRepairsVolume, repairsSetSize, rigRepairsVolume, rumRepairsFactor } from "common/game-tools"
import { maxShallowWaterBR } from "common/na-map-data/constants"
import { degreesToCompass } from "common/na-map-data/coordinates"
import { getOrdinal } from "common/na-map-data/format"
import type { DragData, ShipDisplayData } from "compare-ships"
import { default as shipIcon } from "icons/icon-ship.svg"
import type { HtmlString } from "../../../@types/common"
import type { ShipData } from "../../../@types/na-map-data/ships"

/**
 * Base ship for comparison (displayed on the left side)
 */
export class ColumnBase extends Column {
    readonly shipData: ShipData
    private _speedScale!: ScaleLinear<number, number>
    private _shipRotate!: number
    private _speedText!: Selection<SVGTextElement, DragData, HTMLElement, unknown>
    private _drag!: DragBehavior<SVGCircleElement | SVGPathElement, DragData, DragData | SubjectPosition>

    constructor(outputDivId: HtmlString, shipData: ShipData, shipCompare: CompareShips) {
        super(outputDivId, shipCompare)

        this.shipData = shipData

        this._setBackground()
        this._setupDrag()
        this._setupShipOutline()
        this._drawWindProfile()
        this._printText()
    }

    /**
     * Set coloured Background
     */
    _setBackground(): void {
        // Arc for text
        const speedArc = d3Arc<number>()
            .outerRadius((d) => (this._shipCompare.radiusSpeedScale(d) ?? 0) + 2)
            .innerRadius((d) => (this._shipCompare.radiusSpeedScale(d) ?? 0) + 1)
            .startAngle(-Math.PI / 2)
            .endAngle(Math.PI / 2)

        // Add the paths for the text
        super.mainG
            .append("g")
            .attr("data-ui-component", "speed-textpath")
            .selectAll("path")
            .data(this.ticksSpeed)
            .join((enter) =>
                enter
                    .append("path")
                    .attr("d", speedArc)
                    .attr("id", (d, i) => `tick${i}`),
            )

        // And add the text
        super.mainG
            .append("g")
            .attr("class", "speed-text")
            .selectAll("text")
            .data(this.ticksSpeed)
            .join((enter) =>
                enter
                    .append("text")
                    .append("textPath")
                    .attr("href", (d, i) => `#tick${i}`)
                    .text((d, i) => this.ticksSpeedLabels[i])
                    .attr("startOffset", "10%"),
            )
    }

    _getHeadingInDegrees(rotate: number, degrees: number): number {
        let heading = rotate - degrees - 180
        if (heading < 0) {
            heading += 360
        }

        return heading
    }

    _getSpeed(rotate: number): string {
        return formatFloat(this._speedScale(Math.abs(rotate)) ?? 0)
    }

    _getHeadingInCompass(rotate: number): string {
        return degreesToCompass(rotate)
    }

    _updateCompareWindProfiles(): void {
        for (const otherCompareId of this._shipCompare.columnsCompare) {
            if (this._shipCompare.activeColumns[otherCompareId]) {
                ;(this._shipCompare.activeColumns[otherCompareId] as ColumnCompare).updateWindProfileRotation()
            }
        }
    }

    _setupDrag(): void {
        const steps = this.shipData.speedDegrees.length
        const degreesPerStep = 360 / steps
        const domain = Array.from({ length: steps + 1 }, (_, i) => i * degreesPerStep)

        this._speedScale = d3ScaleLinear()
            .domain(domain)
            .range([...this.shipData.speedDegrees, this.shipData.speedDegrees[0]])
            .clamp(true)

        const dragged = (event: Event, d: DragData): void => {
            const update = (): void => {
                d.this.attr("transform", (d: DragData) => `rotate(${d.rotate})`)
                d.compassText
                    .attr("transform", (d: DragData) => `rotate(${-d.rotate},${d.compassTextX},${d.compassTextY})`)
                    .text((d: DragData) => this._getHeadingInCompass(d.rotate))
                if (d.type === "ship") {
                    this._shipRotate = d.rotate
                } else if (d.type === "windProfile") {
                    this._shipCompare.windProfileRotate = d.rotate
                }

                this._speedText
                    .attr("transform", `rotate(${-this._shipRotate})`)
                    .text(this._getSpeed(this._shipCompare.windProfileRotate - this._shipRotate))
            }

            const { x: xMouse, y: yMouse } = event as MouseEvent
            d.rotate = this._getHeadingInDegrees(
                rotationAngleInDegrees({ x: d.initX, y: d.initY }, { x: xMouse, y: yMouse }),
                d.correctionValueDegrees,
            )
            update()
            if (d.type === "windProfile") {
                this._updateCompareWindProfiles()
            }
        }

        this._drag = d3Drag<SVGCircleElement | SVGPathElement, DragData>()
            .on("drag", (event: Event, d: DragData): void => {
                dragged(event, d)
            })
            .container(() => super.mainG.node() as DragContainerElement)
    }

    _setupShipOutline(): void {
        this._shipRotate = 0
        const { shipMass } = this.shipData
        const heightShip = this._shipCompare.shipMassScale(shipMass) ?? 0
        // noinspection JSSuspiciousNameCombination
        const widthShip = heightShip
        const circleSize = 20
        const svgHeight = this._shipCompare.svgHeight / 2 - 2 * circleSize

        const datum = {
            initX: 0,
            initY: 0,
            initRotate: this._shipRotate,
            correctionValueDegrees: 180,
            compassTextX: 0,
            compassTextY: svgHeight,
            speedTextX: 0,
            speedTextY: 0,
            type: "ship",
        } as DragData

        const gShip = super.mainG.append("g").datum(datum).attr("class", "ship-outline")

        gShip
            .append("line")
            .attr("x1", (d) => d.initX)
            .attr("y1", svgHeight - circleSize)
            .attr("x2", (d) => d.initX)
            .attr("y2", (d) => d.initY)

        gShip
            .append("image")
            .attr("height", heightShip)
            .attr("width", widthShip)
            .attr("x", -heightShip / 2)
            .attr("y", -widthShip / 2)
            .attr("xlink:href", shipIcon)

        gShip
            .append("circle")
            .attr("cx", (d) => d.compassTextX)
            .attr("cy", (d) => d.compassTextY)
            .attr("r", circleSize)
            .call(this._drag as DragBehavior<SVGCircleElement, DragData, DragData | SubjectPosition>)

        const compassText = gShip
            .append("text")
            .attr("x", (d) => d.compassTextX)
            .attr("y", (d) => d.compassTextY)
            .attr("transform", (d) => `rotate(${-d.initRotate},${d.compassTextX},${d.compassTextY})`)
            .text((d) => this._getHeadingInCompass(d.initRotate))

        this._speedText = gShip
            .append("text")
            .attr("x", (d) => d.speedTextX)
            .attr("y", (d) => d.speedTextY)
            .attr("transform", (d) => `rotate(${-d.initRotate})`)
            .text((d) => this._getSpeed(d.initRotate))

        datum.this = gShip
        datum.compassText = compassText
        gShip.datum(datum).attr("transform", (d) => `rotate(${d.initRotate - 90})`)
        gShip
            .transition()
            .duration(1000)
            .delay(500)
            .attr("transform", (d) => `rotate(${d.initRotate})`)
    }

    /**
     * Draw profile
     */
    _drawWindProfile(): void {
        const pie = d3Pie().sort(null).value(1)

        const arcsBase = pie(this.shipData.speedDegrees) as PieArcDatum<number>[]

        const curve = d3CurveCatmullRomClosed
        const line = d3LineRadial<PieArcDatum<number>>()
            .angle((d, i) => i * segmentRadians)
            .radius((d) => this._shipCompare.radiusSpeedScale(d.data) ?? 0)
            .curve(curve)

        // Profile shape
        this._shipCompare.windProfileRotate = 0
        const circleSize = 20
        const svgHeight = this._shipCompare.svgHeight / 2 - circleSize
        const datum = {
            initX: 0,
            initY: 0,
            initRotate: this._shipCompare.windProfileRotate,
            correctionValueDegrees: 0,
            compassTextX: 0,
            compassTextY: -svgHeight,
            type: "windProfile",
        } as DragData

        const gWindProfile = super.mainG.append("g").datum(datum).attr("class", "wind-profile")

        // Add big wind arrow
        gWindProfile
            .append("path")
            .attr(
                "d",
                (d) =>
                    String(drawSvgCircle(d.compassTextX, d.compassTextY, circleSize)) +
                    drawSvgVLine(d.compassTextX, d.compassTextY, -d.compassTextY / 2),
            )

            .attr("class", "wind-profile-arrow")
            .attr("marker-end", "url(#wind-profile-arrow-head)")
            .call(this._drag as DragBehavior<SVGPathElement, DragData, DragData | SubjectPosition>)

        gWindProfile
            .append("circle")
            .attr("cx", (d) => d.compassTextX)
            .attr("cy", (d) => d.compassTextY)
            .attr("r", circleSize)

        const compassText = gWindProfile
            .append("text")
            .attr("x", (d) => d.compassTextX)
            .attr("y", (d) => d.compassTextY)
            .attr("transform", (d) => `rotate(${-d.initRotate},${d.compassTextX},${d.compassTextY})`)
            .text((d) => this._getHeadingInCompass(d.initRotate))

        gWindProfile.append("path").attr("class", "base-profile").attr("d", line(arcsBase))

        // Speed marker
        gWindProfile
            // .insert("g", "g.compass-arc")
            .append("g")
            .attr("data-ui-component", "speed-markers")
            .selectAll("circle")
            .data(arcsBase)
            .join((enter) =>
                enter
                    .append("circle")
                    .attr("r", 5)
                    .attr(
                        "cy",
                        (d, i) => Math.cos(i * segmentRadians) * -(this._shipCompare.radiusSpeedScale(d.data) ?? 0),
                    )
                    .attr(
                        "cx",
                        (d, i) => Math.sin(i * segmentRadians) * (this._shipCompare.radiusSpeedScale(d.data) ?? 0),
                    )
                    .attr("fill", (d) => this._shipCompare.colorScale(d.data) ?? 0)
                    .attr("fill", (d) => this._shipCompare.colorScale(d.data) ?? 0)
                    .append("title")
                    .text((d) => `${Math.round(d.data * 10) / 10} knots`),
            )

        datum.this = gWindProfile
        datum.compassText = compassText
        gWindProfile.datum(datum).attr("transform", (d) => `rotate(${d.initRotate + 90})`)
        gWindProfile
            .transition()
            .duration(1000)
            .delay(500)
            .attr("transform", (d) => `rotate(${d.initRotate})`)

        // colourRamp(d3Select(this._select), this.shipCompareData.colorScale, this._shipData.speedDegrees.length);
    }

    /**
     * Print text
     */
    _printText(): void {
        const cannonsPerDeck = Column.getCannonsPerDeck(this.shipData.guns)
        const hullRepairsNeeded = Math.round(
            (this.shipData.sides.armour * this.shipData.repairAmount!.armour) / hullRepairsVolume,
        )
        const rigRepairsNeeded = Math.round(
            (this.shipData.sails.armour * this.shipData.repairAmount!.sails) / rigRepairsVolume,
        )
        const rumRepairsNeeded = Math.round(this.shipData.crew.max * rumRepairsFactor)

        const ship = {
            // Boarding
            attack: formatSignFloat(this.shipData.boarding.attack!, 2),
            cannonsAccuracy: formatSignInt(this.shipData.boarding.cannonsAccuracy! * 100),
            defense: formatSignFloat(this.shipData.boarding.defense!, 2),
            disengageTime: formatInt(this.shipData.boarding.disengageTime!),
            morale: formatInt(this.shipData.boarding.morale!),
            musketsAccuracy: formatSignInt(this.shipData.boarding.musketsAccuracy! * 100),
            musketsCrew: formatInt((this.shipData.boarding.musketsCrew! / 100) * this.shipData.crew.max),
            prepPerRound: formatInt(this.shipData.boarding.prepPerRound),
            prepInitial: formatInt(this.shipData.boarding.prepInitial),

            // Gunnery
            reload: formatSignInt(this.shipData.gunnery!.reload * 100),
            penetration: formatSignInt(this.shipData.gunnery!.penetration * 100),
            dispersionHorizontal: formatSignInt(this.shipData.gunnery!.dispersionHorizontal * 100),
            dispersionVertical: formatSignInt(this.shipData.gunnery!.dispersionVertical * 100),
            traverseUpDown: formatSignInt(this.shipData.gunnery!.traverseUpDown * 100),
            traverseSide: formatSignInt(this.shipData.gunnery!.traverseSide * 100),

            acceleration: formatFloat(this.shipData.ship.acceleration),
            additionalRow: this.shipData.guns.decks < 4 ? "<br>\u00A0" : "",
            backArmour: `${formatInt(this.shipData.stern.armour)}</br><span class="badge badge-highlight">${formatInt(
                this.shipData.stern.thickness,
            )}</span>`,
            battleRating: String(this.shipData.battleRating),
            bowRepair: formatInt(this.shipData.repairTime.bow),
            cannonBroadsideDamage: formatInt(this.shipData.guns.damage.cannons),
            cannonsPerDeck,
            carroBroadsideDamage: formatInt(this.shipData.guns.damage.carronades),
            deceleration: formatFloat(this.shipData.ship.deceleration),
            decks: pluralise(this.shipData.guns.decks, "deck"),
            firezoneHorizontalWidth: String(this.shipData.ship.firezoneHorizontalWidth),
            frontArmour: `${formatInt(this.shipData.bow.armour)}</br><span class="badge badge-highlight">${formatInt(
                this.shipData.bow.thickness,
            )}</span>`,
            guns: String(this.shipData.guns.total),
            gunsBack: this.shipData.guns.gunsPerDeck[5].amount,
            gunsFront: this.shipData.guns.gunsPerDeck[4].amount,
            halfturnTime: formatFloat(this.shipData.rudder.halfturnTime, 4),
            holdSize: formatInt(this.shipData.holdSize),
            hullRepairAmount: formatInt(
                (this.shipData.repairAmount!.armour + this.shipData.repairAmount!.armourPerk) * 100,
            ),
            hullRepairsNeeded: `${formatInt(hullRepairsNeeded)}\u00A0<span class="badge badge-highlight">${formatInt(
                hullRepairsNeeded * repairsSetSize,
            )}</span>`,
            leakResistance: formatSignInt(this.shipData.resistance!.leaks * 100),
            limitBack: this.shipData.guns.gunsPerDeck[5],
            limitFront: this.shipData.guns.gunsPerDeck[4],
            mastBottomArmour: `${formatInt(
                this.shipData.mast.bottomArmour,
            )}</br><span class="badge badge-highlight">${formatInt(this.shipData.mast.bottomThickness)}</span>`,
            mastMiddleArmour: `${formatInt(
                this.shipData.mast.middleArmour,
            )}</br><span class="badge badge-highlight">${formatInt(this.shipData.mast.middleThickness)}</span>`,
            mastTopArmour: `${formatInt(
                this.shipData.mast.topArmour,
            )}</br><span class="badge badge-highlight">${formatInt(this.shipData.mast.topThickness)}</span>`,
            maxCrew: formatInt(this.shipData.crew.max),
            maxSpeed: formatFloat(this.shipData.speed.max, 3),
            maxWeight: formatInt(this.shipData.maxWeight),
            minCrew: formatInt(this.shipData.crew.min),
            cannonCrew: formatInt(this.shipData.crew.cannons),
            carroCrew: formatInt(this.shipData.crew.carronades),
            pump: formatInt(this.shipData.pump.armour),
            repairTime: formatInt(this.shipData.repairTime.sides),
            rigRepairAmount: formatInt(
                (this.shipData.repairAmount!.sails + this.shipData.repairAmount!.sailsPerk) * 100,
            ),
            rigRepairsNeeded: `${formatInt(rigRepairsNeeded)}\u00A0<span class="badge badge-highlight">${formatInt(
                rigRepairsNeeded * repairsSetSize,
            )}</span>`,
            rollAngle: formatInt(this.shipData.ship.rollAngle),
            rudder: `${formatInt(this.shipData.rudder.armour)}\u00A0<span class="badge badge-highlight">${formatInt(
                this.shipData.rudder.thickness,
            )}</span>`,
            rumRepairsNeeded: `${formatInt(rumRepairsNeeded)}\u00A0<span class="badge badge-highlight">${formatInt(
                rumRepairsNeeded * repairsSetSize,
            )}</span>`,
            sailingCrew: formatInt(this.shipData.crew.sailing ?? 0),
            sails: formatInt(this.shipData.sails.armour),
            shipRating: `${getOrdinal(this.shipData.class)} rate</br>${
                this.shipData.battleRating <= maxShallowWaterBR
                    ? '<i class="mt-2 icon icon-small icon-light icon-shallow" role="img" aria-label="Shallow"></i>'
                    : '<i class="mt-2 icon icon-small icon-light icon-deep" role="img" aria-label="Deep"></i>'
            }`,
            sideArmour: `${formatInt(this.shipData.sides.armour)}</br><span class="badge badge-highlight">${formatInt(
                this.shipData.sides.thickness,
            )}</span>`,
            splinterResistance: formatSignInt(this.shipData.resistance!.splinter * 100),
            sternRepair: formatInt(this.shipData.repairTime.stern),
            structure: formatInt(this.shipData.structure.armour),
            turnAcceleration: formatFloat(this.shipData.ship.turnAcceleration, 4),
            turnSpeed: formatFloat(this.shipData.ship.turnSpeed, 3),
            upgradeXP: formatInt(this.shipData.upgradeXP),
            waterlineHeight: formatFloat(this.shipData.ship.waterlineHeight),
            cannonWeight: formatInt(this.shipData.guns.weight.cannons),
            carroWeight: formatInt(this.shipData.guns.weight.carronades),
        } as ShipDisplayData

        ship.repairWeight = formatInt((hullRepairsNeeded + rigRepairsNeeded + rumRepairsNeeded * 0.1) * repairsSetSize)

        if (ship.gunsFront) {
            ship.gunsFront += `\u00A0${Column.pd(ship.limitFront)}`
        } else {
            ship.gunsFront = "\u2013"
        }

        if (ship.gunsBack) {
            ship.gunsBack += `\u00A0${Column.pd(ship.limitBack)}`
        } else {
            ship.gunsBack = "\u2013"
        }

        super.mainDiv.html(Column.getText(ship))
    }
}
