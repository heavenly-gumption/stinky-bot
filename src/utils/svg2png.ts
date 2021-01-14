import { readFile, writeFile, unlink } from "fs"
import { execFile } from "child_process"
import { join } from "path"

// Location of the moved bash scripts
const SCRIPT_LOCATION = "../../scripts/svg2png.sh"

// Location of the temporary image files created for Inkscape
const TEMP_LOCATION = "../../__temp"

function createSVG(filename: string, svgData: string): Promise<void> {
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

function deleteSVG(filename: string): Promise<void> {
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

function deletePNG(filename: string): Promise<void> {
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

function createPNGFromSVG(filename: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const filepath = join(__filename, TEMP_LOCATION)
        execFile(join(__filename, SCRIPT_LOCATION), [filename, filepath], {}, err => {
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

export async function convertSVGtoPNG(filename: string, svgData: string): Promise<Buffer> {
    await createSVG(filename, svgData)
    await createPNGFromSVG(filename)
    const data = await openPNG(filename)
    await deletePNG(filename)
    await deleteSVG(filename)
    return data
}
