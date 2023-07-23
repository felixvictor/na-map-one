import dayjs from "dayjs"
import "dayjs/locale/en-gb"
import utc from "dayjs/plugin/utc.js"
dayjs.extend(utc)
dayjs.locale("en-gb")
import type { HtmlResult, HtmlString } from "../@types/common"
import htm from "htm"
import { h } from "preact"
const html = htm.bind(h)

const getLocalHour = (hour: number): number => Number(dayjs.utc().hour(hour).local().format("H"))

const formatFromToTimeHtml = (from: number, to: number): HtmlResult =>
    html`<span style="white-space: nowrap;">${String(from)} ‒ ${String(to)}</span>`

const formatTimeHtml = (from: number, to: number): HtmlResult => {
    const fromLocal = getLocalHour(from)
    const toLocal = getLocalHour(to)

    return html`${formatFromToTimeHtml(from, to)} (${formatFromToTimeHtml(fromLocal, toLocal)})`
}

export const getPortBattleTimeHtml = (portBattleStartTime: number): HtmlResult =>
    portBattleStartTime
        ? formatTimeHtml((portBattleStartTime + 10) % 24, (portBattleStartTime + 13) % 24)
        : formatTimeHtml(11, 8)

const formatFromToTime = (from: number, to: number): HtmlString => `${String(from)} ‒ ${String(to)}`

const formatTime = (from: number, to: number): HtmlString => {
    const fromLocal = getLocalHour(from)
    const toLocal = getLocalHour(to)

    return `${formatFromToTime(from, to)} (${formatFromToTime(fromLocal, toLocal)})`
}

export const getPortBattleTime = (portBattleStartTime: number): HtmlString =>
    portBattleStartTime
        ? formatTime((portBattleStartTime + 10) % 24, (portBattleStartTime + 13) % 24)
        : formatTime(11, 8)
