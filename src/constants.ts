import { MemePageKey, MemePage } from "./types/meme"

const SHADOW_PATH = "assets/memes/shadow"
const ShadowSoloPage: MemePage = {
    pageKey: MemePageKey.ShadowSoloPage,
    panels: [
        { 
            topLeft: [0, 0],
            bottomRight: [200, 200]
        }
    ],
    assetPath: `${SHADOW_PATH}/shadow1.png`
}

export const MEME_PAGES: {
    [property in MemePageKey]?: MemePage
} = {
    [MemePageKey.ShadowSoloPage]: ShadowSoloPage
}

export const DEFAULT_MEME_PAGE = ShadowSoloPage
