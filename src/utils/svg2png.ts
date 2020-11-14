import { readFile, writeFile, unlink } from "fs"
import { execFile } from "child_process"
import { join } from "path"

const SCRIPT_LOCATION = "../../scripts/svg2png.sh"
const TEMP_LOCATION = "../../__temp"

function createSVG(filename: string, svgData: string) {
    return new Promise((resolve, reject) => {
        const filepath = join(__filename, TEMP_LOCATION, `${filename}.svg`)
        writeFile(filepath, svgData, (err) => {
            if (err) {
                reject(err)
            }
            resolve()
        })
    })
}

function deleteSVG(filename: string) {
    return new Promise((resolve, reject) => {
        const filepath = join(__filename, TEMP_LOCATION, `${filename}.svg`)
        unlink(filepath, (err) => {
            if (err) {
                reject(err)
            }
            resolve()
        })
    })
}

function deletePNG(filename: string) {
    return new Promise((resolve, reject) => {
        const filepath = join(__filename, TEMP_LOCATION, `${filename}.png`)
        unlink(filepath, (err) => {
            if (err) {
                reject(err)
            }
            resolve()
        })
    })
}

function createPNGFromSVG(filename: string) {
    return new Promise((resolve, reject) => {
        const filepath = join(__filename, TEMP_LOCATION)
        execFile(join(__filename, SCRIPT_LOCATION), [filename, filepath], {}, (err, stdout, stderr) => {
            console.log(stdout)
            console.error(stderr)
            if (err) {
                reject(err)
            }
            resolve()
        })
    })
}

function openPNG(filename: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const filepath = join(__filename, TEMP_LOCATION, `${filename}.png`)
        readFile(filepath, (err, data) => {
            if (err) {
                reject(err)
            }
            resolve(data)
        })
    })
}

export async function convertSVGtoPNG(filename: string, svgData: string) {
    await createSVG(filename, svgData)
    await createPNGFromSVG(filename)
    const data = await openPNG(filename)
    // await deletePNG(filename)
    // await deleteSVG(filename)
    return data
}
