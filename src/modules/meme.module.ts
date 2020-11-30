import { join } from "path"
import { Client, Message } from "discord.js"
import Jimp from "jimp"
import { MemePageKey, MemePanel, MemePage, Point } from "../types/meme"
import { MEME_PAGES, DEFAULT_MEME_PAGE } from "../constants"
import { BotModule } from "../types/index"

const MEME_REGEX = /!make-meme (.+)/
const DEFAULT_MEME_TEXT = "god shadow is so cool"
const FONTS = [
    {
        size: 128,
        black: Jimp.FONT_SANS_128_BLACK,
        white: Jimp.FONT_SANS_128_WHITE
    },
    {
        size: 64,
        black: Jimp.FONT_SANS_64_BLACK,
        white: Jimp.FONT_SANS_64_WHITE
    },
    {
        size: 32,
        black: Jimp.FONT_SANS_32_BLACK,
        white: Jimp.FONT_SANS_32_WHITE
    },
    {
        size: 16,
        black: Jimp.FONT_SANS_16_BLACK,
        white: Jimp.FONT_SANS_16_WHITE
    },
    {
        size: 8,
        black: Jimp.FONT_SANS_8_BLACK,
        white: Jimp.FONT_SANS_8_WHITE
    }
]

function getMemePage(key: MemePageKey): MemePage {
    return MEME_PAGES[key] || DEFAULT_MEME_PAGE
}

function getRelativePath(path: string) {
    return join(__dirname, `../../${path}`)
}

async function loadPicture(path: string) {
    return await Jimp.read(getRelativePath(path))
}

function getPanelHeight(panel: MemePanel) {
    return Math.abs(panel.bottomRight[1] - panel.topLeft[1])
}

function getPanelWidth(panel: MemePanel) {
    return Math.abs(panel.bottomRight[0] - panel.topLeft[0])
}

async function determineFont(panel: MemePanel, text: string, color: "black" | "white" = "black") {
    const width = getPanelWidth(panel)
    const maxHeight = getPanelHeight(panel)
    for (let index = 0; index < FONTS.length - 1; index++) {
        const fontTuple = FONTS[index]
        const font = await Jimp.loadFont(fontTuple[color])
        const height = Jimp.measureTextHeight(font, text, width)
        console.log(`Attempting size ${fontTuple.size} and text height ${height} in a rectangle of size (${width}, ${maxHeight})`)
        if (height <= maxHeight) {
            return {
                font,
                width,
                height
            }
        }
    }
    const smallestFontTuple = FONTS[FONTS.length - 1]
    const font = await Jimp.loadFont(smallestFontTuple[color])
    const height = Jimp.measureTextHeight(font, text, width)
    console.log(`Attempting size ${smallestFontTuple.size} and text height ${height} in a rectangle of size (${width}, ${maxHeight})`)
    return {
        font,
        width,
        height
    }
}

function determineTextOriginPoint(panel: MemePanel, textWidth: number, textHeight: number): Point {
    const width = getPanelWidth(panel)
    const height = getPanelHeight(panel)
    const [x, y] = panel.topLeft
    const xDelta = ~~(Math.abs(width - textWidth) / 2)
    const yDelta = ~~(Math.abs(height - textHeight) / 2)
    return [x + xDelta, y + yDelta]
}


async function applyPanelText(image: Jimp, panel: MemePanel, text: string) {
    const {
        font,
        height,
        width
    } = await determineFont(panel, text, "black")
    const [x, y] = determineTextOriginPoint(panel, width, height)
    const maxWidth = getPanelWidth(panel)
    await image.print(font, x, y, {
        text,
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
    }, maxWidth)
}

async function renderMemePage(key: MemePageKey, panelTexts: string[] = []) {
    const page = getMemePage(key)
    const image = await loadPicture(page.assetPath)
    for (let index = 0; index < page.panels.length; index++) {
        await applyPanelText(image, page.panels[index], panelTexts[index] || DEFAULT_MEME_TEXT)
    }
    return image.getBufferAsync(Jimp.MIME_PNG)
}

async function handleMemeQuery(message: Message) {
    const memeRegexMatch = message.content.match(MEME_REGEX)
    const panelTexts = memeRegexMatch ? [memeRegexMatch[1]] : []
    const memeBuffer = await renderMemePage(MemePageKey.ShadowSoloPage, panelTexts)
    await message.channel.send(`<@${message.author.id}>`, {
        file: {
            attachment: memeBuffer
        }
    })
}
export const MemeModule: BotModule = (client: Client) => {
    console.log("Loaded MemeModule")
    client.on("message", async message => {
        if (message.content && message.content.startsWith("!make-meme")) {
            await handleMemeQuery(message)
        }
    })
}