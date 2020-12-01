import { Font } from "@jimp/plugin-print"

export enum MemePageKey {
    ShadowSoloPage = "shadow1",
    ShadowTimePrisonFirstPage = "timeprison1",
    ShadowTimePrisonSecondPage = "timeprison2",
    ShadowTimePrisonThirdPage = "timeprison3"
}

export type Point = [
    number,
    number
]

export type MemePanel = {
    topLeft: Point,
    bottomRight: Point,
    textColor: "black" | "white"
}

export type MemePage = {
    panels: MemePanel[],
    pageKey: MemePageKey,
    assetPath: string
}

export type FontTuple = {
    size: number,
    black: string,
    white: string
}

export type LoadedFontTuple = {
    size: number,
    black: Font,
    white: Font
}