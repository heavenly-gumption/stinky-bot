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
    bottomRight: Point
}

export type MemePage = {
    panels: MemePanel[],
    pageKey: MemePageKey,
    assetPath: string
}