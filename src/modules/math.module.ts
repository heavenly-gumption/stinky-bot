import { BotModule } from "../types"
import { Client, Message } from "discord.js"
import { mathjax } from "mathjax-full/js/mathjax"
import { liteAdaptor } from "mathjax-full/js/adaptors/liteAdaptor"
import { RegisterHTMLHandler } from "mathjax-full/js/handlers/html"
import { TeX } from "mathjax-full/js/input/tex"
import { SVG } from "mathjax-full/js/output/svg"
import { convertSVGtoPNG } from "../utils/svg2png"
import { LiteElement } from "mathjax-full/js/adaptors/lite/Element"

const EQ_COMMAND_REGEX = /\$eq (?<equation>(.|\n)*)/
const MATH_JAX_OPTIONS = {
    InputJax: new TeX({ packages: ["base", "amsmath"]}),
    OutputJax: new SVG()
}
const EX_TO_PX_FACTOR = 25
const DEFAULT_PX_WIDTH = 640
const DEFAULT_PX_HEIGHT = 480

const adaptor = liteAdaptor()
RegisterHTMLHandler(adaptor)

function inPixels(size: number) {
    return `${size}px`
}

function fromEx(size: string): number {
    return parseFloat(size.replace("ex", ""))
}

function exToPixels(size: string, factor = EX_TO_PX_FACTOR): string {
    return inPixels(~~(fromEx(size) * factor))
}

function isEx(size: string | null): boolean {
    return size ? size.endsWith("ex") : false
}

function renderMathJax(document: string) {
    const html = mathjax.document("", MATH_JAX_OPTIONS)
    const node = html.convert(document, {})
    const svgNode = adaptor.firstChild(node) as LiteElement
    const exWidth = adaptor.getAttribute(svgNode, "width")
    const exHeight = adaptor.getAttribute(svgNode, "height")
    const pxWidth = isEx(exWidth) ? exToPixels(exWidth) : DEFAULT_PX_WIDTH
    const pxHeight = isEx(exHeight) ? exToPixels(exHeight) : DEFAULT_PX_HEIGHT
    adaptor.setAttribute(svgNode, "width", pxWidth)
    adaptor.setAttribute(svgNode, "height", pxHeight)
    const svg = adaptor.innerHTML(node)
    console.log(svg)
    return svg
}

function extractMathJaxFromMessageContent(messageContent: string): string {
    const matches = messageContent.matchAll(EQ_COMMAND_REGEX)
    const equations: string[] = []
    for (const { groups } of matches) {
        if (groups && groups.equation) {
            equations.push(groups.equation)
        }
    }
    const equationString = equations.join("\n")
    console.log(equationString)
    return equationString
}

function getUniqueMessageIdentifier(message: Message): string {
    return `${message.author.id}-${message.id}`
}

async function handleMathJax(message: Message) {
    const id = getUniqueMessageIdentifier(message)
    try {
        const document = extractMathJaxFromMessageContent(message.content)
        const svgData = renderMathJax(document)
        const pngBuffer = await convertSVGtoPNG(id, svgData)
        console.log("Successfully rendered png")
        return message.channel.send(`~ Done parsing for ${id} ~`, {
            file: {
                attachment: pngBuffer
            }
        })
    } catch (error) {
        console.log(error)
        return message.channel.send(`~ Error parsing for ${id} ~`)
    }

}

export const MathModule: BotModule = (client: Client) => {
    console.log("Loaded MathModule")
    client.on("message", async message => {
        if (message.channel && EQ_COMMAND_REGEX.test(message.content)) {
            await handleMathJax(message)
        }
    })
}