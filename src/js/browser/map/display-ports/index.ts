import { select as d3Select, type Selection } from "d3-selection"

import Cookie from "../../components/cookie"
import RadioButton from "../../components/radio-button"
import type { NAMap } from "../na-map"

import { loadJsonFile } from "common/json"
import { minMapScale } from "common/na-map-data/constants"
import type { Extent, Point } from "common/na-map-data/coordinates"
import type { SVGGDatum, ZoomLevel } from "../../../@types/common"
import type { PortBasic, PortBattlePerServer, PortPerServer, PortWithTrades } from "../../../@types/na-map-data/ports"
import PortCircles from "./circles"
import Counties from "./counties"
import Flags from "./flags"
import PatrolZones from "./patrol-zones"
import PortIcons from "./port-icons"
import type { CurrentPort } from "./port-names"
import PortNames from "./port-names"
import Regions from "./regions"
import Summary from "./summary"

interface ReadData {
    [index: string]: PortBasic[] | PortPerServer[] | PortBattlePerServer[]
    ports: PortBasic[]
    server: PortPerServer[]
    pb: PortBattlePerServer[]
}

export default class DisplayPorts {
    #counties!: Counties
    // eslint-disable-next-line no-unused-private-class-members
    #gPort = {} as Selection<SVGGElement, SVGGDatum, HTMLElement, unknown>
    #lowerBound = {} as Point
    #patrolZones!: PatrolZones
    #portCircles!: PortCircles
    #portData = {} as PortWithTrades[]
    #portDataDefault!: PortWithTrades[]
    #portDataFiltered!: PortWithTrades[]
    #portNames!: PortNames
    #regions!: Regions
    #scale = 0
    #showCurrentGood = false
    #showRadius = ""
    #summary!: Summary
    #upperBound = {} as Point
    #zoomLevel: ZoomLevel = "initial"
    portIcons!: PortIcons
    readonly #baseId = "show-radius"
    readonly #cookie: Cookie
    readonly #radioButtonValues: string[]
    readonly #radios: RadioButton
    readonly #serverName: string

    constructor(readonly map: NAMap) {
        this.#serverName = this.map.serverName
        this.#scale = minMapScale

        /**
         * Possible values for show radius (first is default value)
         */
        this.#radioButtonValues = ["off", "county", "points", "position", "tax", "net"]

        /**
         * Show radius cookie
         */
        this.#cookie = new Cookie({ id: this.#baseId, values: this.#radioButtonValues })

        /**
         * Show radius radio buttons
         */
        this.#radios = new RadioButton(this.#baseId, this.#radioButtonValues)

        /**
         * Get showRadius setting from cookie or use default value
         */
        this.showRadius = this._getShowRadiusSetting()
    }

    async init(): Promise<void> {
        await this._loadAndSetupData()
    }

    async _setupData(data: ReadData): Promise<void> {
        // Combine port data with port battle data
        this.#portDataDefault = data.ports.map((port: PortBasic) => {
            const serverData = data.server.find((d: PortPerServer) => d.id === port.id) ?? ({} as PortPerServer)
            const pbData = data.pb.find((d: PortBattlePerServer) => d.id === port.id) ?? ({} as PortBattlePerServer)
            const combinedData = { ...port, ...serverData, ...pbData } as PortWithTrades

            return combinedData
        })
        this.#portData = this.#portDataDefault

        this._setupListener()
        this._setupSvg()
        this.#summary = new Summary()
        this.#portCircles = new PortCircles(this.#portDataDefault)
        this.portIcons = new PortIcons(this.#serverName)
        await this.portIcons.loadData()
        this.#portNames = new PortNames()
        this.#counties = new Counties()
        this.#regions = new Regions()
        this.#patrolZones = new PatrolZones(this.#serverName)
        void new Flags()
    }

    async _loadData(): Promise<ReadData> {
        const readData = {} as ReadData
        readData.ports = await loadJsonFile<PortBasic[]>("ports")
        readData.server = await loadJsonFile<PortPerServer[]>(`${this.#serverName}-ports`)
        readData.pb = await loadJsonFile<PortBattlePerServer[]>(`${this.#serverName}-pb`)
        return readData
    }

    async _loadAndSetupData(): Promise<void> {
        const readData = await this._loadData()
        await this._setupData(readData)
    }

    _setupListener(): void {
        document.querySelector("#show-radius")?.addEventListener("change", () => {
            this._showRadiusSelected()
        })
    }

    /**
     * Get show setting from cookie or use default value
     * @returns Show setting
     */
    _getShowRadiusSetting(): string {
        let r = this.#cookie.get()

        // Radius "position" after reload is useless
        if (r === "position") {
            ;[r] = this.#radioButtonValues
            this.#cookie.set(r)
        }

        this.#radios.set(r)

        return r
    }

    _showRadiusSelected(): void {
        this.showRadius = this.#radios.get()
        this.#cookie.set(this.showRadius)
        this.update()
    }

    _setupSvg(): void {
        this.#gPort = d3Select<SVGGElement, SVGGDatum>("#map")
            .insert("g", "g.f11")
            .attr("data-ui-component", "ports")
            .attr("id", "ports")
    }

    portNamesUpdate() {
        this.#portNames.update(this.zoomLevel, this.#scale, this.#portDataFiltered)
    }

    update(scale?: number): void {
        this.#scale = scale ?? this.#scale

        this._filterVisible()
        this.portIcons.update(this.#scale, this.showRadius, this.#portDataFiltered)
        this.#portCircles.update(this.#scale, this.#portDataFiltered, this.showRadius, this.portIcons.tradePort.id)
        this.portNamesUpdate()
        this.#counties.update(this.zoomLevel, this.#lowerBound, this.#upperBound, this.showRadius)
        this.#regions.update(this.zoomLevel, this.#lowerBound, this.#upperBound)
        this.#patrolZones.update(this.zoomLevel)
        this.#summary.update(this.#portData)
    }

    _filterVisible(): void {
        if (this.showRadius === "position") {
            this.#portDataFiltered = this.#portData
        } else {
            this.#portDataFiltered = this.#portData.filter(
                (port) =>
                    port.coordinates[0] >= this.#lowerBound[0] &&
                    port.coordinates[0] <= this.#upperBound[0] &&
                    port.coordinates[1] >= this.#lowerBound[1] &&
                    port.coordinates[1] <= this.#upperBound[1],
            )
        }
    }

    /**
     * Set bounds of current viewport
     * @param viewport - Current viewport
     */
    setBounds(viewport: Extent): void {
        this.#lowerBound = viewport[0]
        this.#upperBound = viewport[1]
    }

    setShowRadiusSetting(showRadius = this.#radioButtonValues[0]): void {
        this.showRadius = showRadius
        this.#radios.set(this.showRadius)
        this.#cookie.set(this.showRadius)
    }

    clearMap(scale?: number): void {
        this.#summary.show()
        this.#portData = this.#portDataDefault
        this.setShowRadiusSetting()
        this.update(scale)
    }

    get currentPort(): CurrentPort {
        return this.#portNames.currentPort
    }

    set currentPort(newCurrentPort: CurrentPort) {
        this.#portNames.currentPort = newCurrentPort
    }

    get portData(): PortWithTrades[] {
        return this.#portData
    }

    set portData(newPortData: PortWithTrades[]) {
        this.#portData = newPortData
    }

    get portDataDefault(): PortWithTrades[] {
        return this.#portDataDefault
    }

    get showRadius(): string {
        return this.#showRadius
    }

    set showRadius(newShowRadius: string) {
        this.#showRadius = newShowRadius
    }

    get showTradePortPartners(): boolean {
        return this.#showCurrentGood
    }

    get zoomLevel(): ZoomLevel {
        return this.#zoomLevel
    }

    set zoomLevel(newZoomLevel: ZoomLevel) {
        this.#zoomLevel = newZoomLevel
    }
}
