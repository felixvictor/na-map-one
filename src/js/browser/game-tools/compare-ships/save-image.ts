import html2canvas from "html2canvas"

import { select as d3Select } from "d3-selection"

import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
dayjs.extend(utc)

import { showCursorDefault, showCursorWait } from "common/DOM"
import type { SelectedData, ShipColumnTypeList } from "compare-ships"
import type { HtmlString } from "../../../@types/common"
import type { ShipColumnType } from "./index"
import CompareShipsModal from "./modal"

export default class SaveImage {
    #baseId: HtmlString
    #data: ShipColumnTypeList<SelectedData>
    #modal: CompareShipsModal

    constructor(id: HtmlString, data: ShipColumnTypeList<SelectedData>, modal: CompareShipsModal) {
        this.#baseId = id
        this.#data = data
        this.#modal = modal
    }

    static _saveCanvasAsImage(uri: string): void {
        const date = dayjs.utc().format("YYYY-MM-DD HH-mm-ss")
        const fileName = `na-map ship compare ${date}.png`
        const link = document.createElement("a")

        link.href = uri
        link.download = fileName

        // Firefox requires the link to be in the body
        document.body.append(link)

        // simulate click
        link.click()

        // remove the link when done
        link.remove()
    }

    _printSelectedData(clonedDocument: Document, selectedData: SelectedData, columnId: ShipColumnType): void {
        const selectShip = clonedDocument.querySelector<HTMLElement>(`#${this.#modal.getBaseIdSelectsShip(columnId)}`)
        const selectShipParent = selectShip?.parentNode as HTMLElement
        const mainDivElem = selectShipParent?.parentNode as HTMLElement

        selectShipParent.remove()
        clonedDocument.querySelector<HTMLElement>(`#${this.#modal.getBaseIdSelects(columnId)}`)?.remove()

        const mainDiv = d3Select(mainDivElem).insert("div", ":first-child").style("height", "5rem")

        if (selectedData.ship) {
            mainDiv.append("div").style("margin-bottom", "5px").style("line-height", "1.1").text(selectedData.ship)
        }

        if (selectedData.wood[0] !== "") {
            mainDiv
                .append("div")
                .style("font-size", "smaller")
                .style("margin-bottom", "5px")
                .style("line-height", "1.1")
                .text(selectedData.wood.join(" | "))
        }

        for (const [key, value] of selectedData.moduleData) {
            if (value !== "") {
                mainDiv
                    .append("div")
                    .style("font-size", "small")
                    .style("margin-bottom", "5px")
                    .style("line-height", "1.1")
                    .html(`<em>${key}</em>: ${value}`)
            }
        }
    }

    _replaceSelectsWithText(clonedDocument: Document): void {
        for (const [key, value] of Object.entries(this.#data)) {
            this._printSelectedData(clonedDocument, value, key)
        }
    }

    async _save(element: HTMLElement): Promise<void> {
        if (element) {
            const canvas = await html2canvas(element, {
                allowTaint: true,
                foreignObjectRendering: true,
                ignoreElements: (element) =>
                    element.classList.contains("central") ||
                    element.classList.contains("overlay") ||
                    element.classList.contains("navbar"),
                logging: true,
                onclone: (clonedDocument) => {
                    this._replaceSelectsWithText(clonedDocument)
                },
                x: 0,
                y: 0,
            })

            SaveImage._saveCanvasAsImage(canvas.toDataURL())
        }
    }

    async init(): Promise<void> {
        showCursorWait()
        await this._save(this.#modal.getModalNode())
        showCursorDefault()
    }
}
