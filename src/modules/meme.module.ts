import { join } from "path"
import { Client, Message } from "discord.js"
import Jimp from "jimp"
import { MemePageKey, MemePanel, MemePage, Point, FontTuple, LoadedFontTuple } from "../types/meme"
import { MEME_PAGES, DEFAULT_MEME_PAGE } from "../constants"
import { BotModule } from "../types/index"

const MEME_COMMAND = "!make-meme "
const MEME_PAGE_KEY_DELIMITER = "="
const MEME_DELIMITER = ";"
const MEME_BOUNDARY_THRESHOLD = 20
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

async function loadRasterFonts(fontTuples: FontTuple[]): Promise<LoadedFontTuple[]> {
    const rasterFonts = fontTuples.map(async ({ size, black, white }) => ({
        size,
        black: await Jimp.loadFont(black),
        white: await Jimp.loadFont(white)
    }))
    return Promise.all(rasterFonts)
}

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

function getPanelCenter(panel: MemePanel): Point {
    const xDelta = ~~((panel.bottomRight[0] - panel.topLeft[0]) / 2)
    const yDelta = ~~((panel.bottomRight[1] - panel.topLeft[1]) / 2)
    return [panel.topLeft[0] + xDelta, panel.topLeft[1] + yDelta]
}

function determineFont(panel: MemePanel, text: string, fonts: LoadedFontTuple[]) {
    const maxWidth = getPanelWidth(panel)
    const maxHeight = getPanelHeight(panel)
    for (let index = 0; index < fonts.length - 1; index++) {
        const fontTuple = fonts[index]
        const font = fontTuple[panel.textColor]
        const width = maxWidth
        const height = Jimp.measureTextHeight(font, text, maxWidth)
        console.log(`Attempting size ${fontTuple.size}, text width ${width}, and text height ${height} in a rectangle of size (${maxWidth}, ${maxHeight})`)
        if (height - maxHeight <= MEME_BOUNDARY_THRESHOLD) {
            return {
                font,
                width,
                height
            }
        }
    }
    const smallestFontTuple = fonts[fonts.length - 1]
    const font = smallestFontTuple[panel.textColor]
    const width = Jimp.measureText(font, text)
    const height = Jimp.measureTextHeight(font, text, maxWidth)
    console.log(`Attempting size ${smallestFontTuple.size}, text width ${width}, and text height ${height} in a rectangle of size (${maxWidth}, ${maxHeight})`)
    return {
        font,
        width,
        height
    }
}

function determineTextOriginPoint(panel: MemePanel, textWidth: number, textHeight: number): Point {
    const [x, y] = getPanelCenter(panel)
    const textWidthDelta = ~~(textWidth / 2)
    const textHeightDelta = ~~(textHeight / 2)
    // const textWidthDelta = 0
    // const textHeightDelta = 0
    console.log({
        x, y,
        topLeft: panel.topLeft,
        bottomRight: panel.bottomRight,
        textWidth,
        textHeight,
        textWidthDelta,
        textHeightDelta,
        origin: [x - textWidthDelta, y - textHeightDelta]
    })
    return [x - textWidthDelta, y - textHeightDelta]
}


async function applyPanelText(image: Jimp, panel: MemePanel, text: string, fonts: LoadedFontTuple[]) {
    const {
        font,
        height,
        width
    } = determineFont(panel, text, fonts)
    const [x, y] = determineTextOriginPoint(panel, width, height)
    const maxWidth = getPanelWidth(panel)
    const maxHeight = getPanelHeight(panel)
    console.log({
        text,
        x,
        y,
        width,
        height,
        maxWidth,
        maxHeight
    })
    await image.print(font, x, y, {
        text,
    }, width, height)
}

async function renderMemePage(page: MemePage, panelTexts: string[] = [], fonts: LoadedFontTuple[]) {
    const image = await loadPicture(page.assetPath)
    for (let index = 0; index < page.panels.length; index++) {
        await applyPanelText(image, page.panels[index], panelTexts[index] || DEFAULT_MEME_TEXT, fonts)
    }
    return image.getBufferAsync(Jimp.MIME_PNG)
}

function extractInformationFromQuery(fullQuery: string) {
    const query = fullQuery.substr(MEME_COMMAND.length)
    const queryPageKey = query.substr(0, query.indexOf(MEME_PAGE_KEY_DELIMITER)) as MemePageKey
    const page = getMemePage(queryPageKey)
    const queryPageText = query.substr(queryPageKey.length + MEME_PAGE_KEY_DELIMITER.length)
    const panelTexts = queryPageText.split(MEME_DELIMITER).map(panelTextToken => panelTextToken.trim())
    console.log({
        query,
        queryPageKey,
        queryPageText,
        panelTexts
    })
    return {
        page,
        panelTexts
    }
}

async function handleMemeQuery(message: Message, fonts: LoadedFontTuple[]) {
    const { page, panelTexts } = extractInformationFromQuery(message.content)
    const memeBuffer = await renderMemePage(page, panelTexts, fonts)
    await message.channel.send(`<@${message.author.id}>`, {
        file: {
            attachment: memeBuffer
        }
    })
}

export const MemeModule: BotModule = (client: Client) => {
    loadRasterFonts(FONTS)
    .then(fonts => {
        console.log("Loaded MemeModule")
        client.on("message", async message => {
            if (message.content && message.content.startsWith(MEME_COMMAND)) {
                await handleMemeQuery(message, fonts)
            }
        })
    })
    
}