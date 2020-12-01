import { MemePageKey, MemePage } from "./types/meme"

const SHADOW_PATH = "assets/memes/shadow"
const ShadowSoloPage: MemePage = {
    pageKey: MemePageKey.ShadowSoloPage,
    panels: [
        { 
            topLeft: [0, 0],
            bottomRight: [215, 181],
            textColor: "black"
        }
    ],
    assetPath: `${SHADOW_PATH}/shadow1.png`
}
const ShadowTimePrisonFirstPage: MemePage = {
    pageKey: MemePageKey.ShadowTimePrisonFirstPage,
    panels: [
        {
            topLeft: [440, 27],
            bottomRight: [779, 444],
            textColor: "black"
        },
        {
            topLeft: [0, 518],
            bottomRight: [124, 669],
            textColor: "black"
        },
        {
            topLeft: [515, 505],
            bottomRight: [698, 574],
            textColor: "black"
        },
        {
            topLeft: [0, 850],
            bottomRight: [246, 1050],
            textColor: "black"
        },
        {
            topLeft: [384, 855],
            bottomRight: [563, 1047],
            textColor: "black"
        }
    ],
    assetPath: `${SHADOW_PATH}/timeprison1.png`
}
const ShadowTimePrisonSecondPage: MemePage = {
    pageKey: MemePageKey.ShadowTimePrisonFirstPage,
    panels: [
        {
            topLeft: [376, 12],
            bottomRight: [642, 319],
            textColor: "black"
        },
        {
            topLeft: [286, 476],
            bottomRight: [770, 755],
            textColor: "black"
        },
        {
            topLeft: [0, 857],
            bottomRight: [380, 1173],
            textColor: "black"
        },
    ],
    assetPath: `${SHADOW_PATH}/timeprison2.png`
}
const ShadowTimePrisonThirdPage: MemePage = {
    pageKey: MemePageKey.ShadowTimePrisonFirstPage,
    panels: [
        {
            topLeft: [440, 0],
            bottomRight: [588, 316],
            textColor: "black"
        },
        {
            topLeft: [274, 375],
            bottomRight: [395, 600],
            textColor: "black"
        },
        {
            topLeft: [395, 774],
            bottomRight: [740, 995],
            textColor: "black"
        },
    ],
    assetPath: `${SHADOW_PATH}/timeprison3.png`
}

export const MEME_PAGES: {
    [property in MemePageKey]?: MemePage
} = {
    [MemePageKey.ShadowSoloPage]: ShadowSoloPage,
    [MemePageKey.ShadowTimePrisonFirstPage]: ShadowTimePrisonFirstPage,
    [MemePageKey.ShadowTimePrisonSecondPage]: ShadowTimePrisonSecondPage,
    [MemePageKey.ShadowTimePrisonThirdPage]: ShadowTimePrisonThirdPage
}

export const DEFAULT_MEME_PAGE = ShadowSoloPage
