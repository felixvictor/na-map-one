import type { Attributes, VNode } from "preact"
import type { PortBasic, PortBattlePerServer, PortPerServer } from "./na-map-data/ports"

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SVGSVGDatum {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SVGGDatum {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DivDatum {}

export interface MinMaxCoord {
    min: number
    max: number
}

export type ArrayIndex<T> = T[] & Record<string, T[]>

export type NestedArrayIndex<T> = Record<string, ArrayIndex<T>>

export type Index<T> = Record<string, T>

export type NestedIndex<T> = Record<string, Index<T>>

export type HtmlResult = VNode<Attributes> | VNode<Attributes>[]

export type SVGString = string
export type HtmlString = string
export interface BaseModal {
    id: HtmlString
    title: HtmlString
    size?: string
}
export interface BaseModalPure extends BaseModal {
    buttonText?: HtmlString
}

export interface BaseModalHtml extends BaseModal {
    body: () => HtmlResult
    footer: () => HtmlResult
}

type ZoomLevel = "initial" | "portLabel" | "pbZone"

type Key = string
export interface HeaderMap {
    group: Map<Key, number>
    element: Set<Key>
}

type PortIncome = PortBasic & PortPerServer & PortBattlePerServer
export interface PortJsonData {
    ports: PortBasic[]
    pb: PortBattlePerServer[]
    server: PortPerServer[]
}

export interface ImagePromiseError {
    loaded: string[]
    errored: string[]
}
