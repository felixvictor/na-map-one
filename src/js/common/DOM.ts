import { default as BSDropdown } from "bootstrap/js/dist/dropdown"
import { select as d3Select } from "d3-selection"

import type { BaseModalPure, HtmlString } from "../@types/common"

export const showCursorWait = (): void => {
    document.body.style.cursor = "wait"
}

export const showCursorDefault = (): void => {
    document.body.style.cursor = "default"
}

/**
 * {@link https://stackoverflow.com/a/54662026}
 * @param id - Id
 */
export const getCanvasElementById = (id: string): HTMLCanvasElement => {
    const canvas = document.querySelector(id)

    if (!(canvas instanceof HTMLCanvasElement)) {
        throw new TypeError(
            `The element of id "${id}" is not a HTMLCanvasElement. Make sure a <canvas id="${id}""> element is present in the document.`,
        )
    }

    return canvas
}

/**
 * {@link https://stackoverflow.com/a/54662026}
 * @param canvas - Canvas
 */
export const getCanvasRenderingContext2D = (canvas: HTMLCanvasElement): CanvasRenderingContext2D => {
    const context = canvas.getContext("2d")

    if (context === null) {
        throw new Error("This browser does not support 2-dimensional canvas rendering contexts.")
    }

    return context
}

export const getElementHeight = (element: HTMLElement | SVGElement): number => {
    const { height } = element.getBoundingClientRect()

    return Math.floor(height)
}

export const getElementWidth = (element: HTMLElement | SVGElement): number => {
    const { width } = element.getBoundingClientRect()

    return Math.floor(width)
}

export const getIdFromBaseName = (baseName: string): HtmlString =>
    baseName.toLocaleLowerCase().replace("of ", "").replaceAll(" ", "-").replaceAll("’", "")

/**
 * Enable nested dropdowns in navbar
 * {@link https://stackoverflow.com/a/66470962}
 */
export const initMultiDropdownNavbar = (id: string): void => {
    const CLASS_NAME = "has-child-dropdown-show"
    const mainElement = document.querySelector(`#${id}`) as HTMLElement

    BSDropdown.prototype.toggle = (function (_original) {
        return function () {
            for (const e of document.querySelectorAll(`.${CLASS_NAME}`)) {
                e.classList.remove(CLASS_NAME)
            }

            // @ts-expect-error lala
            let dd = this._element.closest(".dropdown").parentNode.closest(".dropdown") as Element | Document | null
            for (; dd && dd !== document; dd = (dd.parentNode as Element).closest(".dropdown")) {
                ;(dd as Element).classList.add(CLASS_NAME)
            }

            // @ts-expect-error lala
            _original.call(this)
        }
    })(BSDropdown.prototype.toggle)

    for (const dd of mainElement.querySelectorAll(".dropdown")) {
        dd.addEventListener("hide.bs.dropdown", function (this: HTMLElement, e: Event) {
            if (this.classList.contains(CLASS_NAME)) {
                this.classList.remove(CLASS_NAME)
                e.preventDefault()
            }

            // @ts-expect-error lala
            if (e.clickEvent?.composedPath().some((el) => el.classList?.contains("dropdown-toggle"))) {
                e.preventDefault()
            }

            e.stopPropagation() // do not need pop in multi level mode
        })
    }
}

/**
 * Insert bootstrap modal
 * @param id - Modal id
 * @param title - Modal title
 * @param size - Modal size, "xl" (default)
 * @param buttonText - Button text, "Close" (default)
 */
export const insertBaseModal = ({ id, title, size = "modal-xl", buttonText = "Close" }: BaseModalPure): void => {
    const modal = d3Select("#modal-section")
        .append("div")
        .attr("id", id)
        .attr("class", "modal")
        .attr("tabindex", "-1")
        .attr("role", "dialog")
        .attr("aria-labelledby", `title-${id}`)
        .attr("aria-hidden", "true")
        .append("div")
        .attr("class", `modal-dialog ${size}`)
        .attr("role", "document")

    const content = modal.append("div").attr("class", "modal-content")

    const header = content.append("header").attr("class", "modal-header")
    header.append("h5").attr("class", "modal-title").attr("id", `title-${id}`).html(title)

    content.append("div").attr("class", "modal-body")

    const footer = content.append("footer").attr("class", "modal-footer")
    footer
        .append("button")
        .text(buttonText)
        .attr("type", "button")
        .attr("class", "btn btn-secondary")
        .attr("data-bs-dismiss", "modal")
}
