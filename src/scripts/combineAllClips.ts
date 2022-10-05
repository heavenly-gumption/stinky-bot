import * as fs from "fs"
import { Clip } from "../types/models/clip.dao"

async function main() {
  const clips = JSON.parse(fs.readFileSync("clips.json", { encoding: "utf8"}))
  for (const clip of clips.sort((a: any, b: any) => a.time._seconds - b.time._seconds)) {
    console.log(clip.id + " " + clip.name)
    let data = fs.readFileSync("clipdata/" + clip.id + ".pcm")
    if (data.length % 2 === 1) {
      data = data.slice(0, data.length - 1)
    }
    fs.appendFileSync("clipdata/combined.pcm", data)
  }
}

main()