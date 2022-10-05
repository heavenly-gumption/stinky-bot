import { getClipDao } from "../utils/model"
import S3 from "aws-sdk/clients/s3"
import { Clip } from "../types/models/clip.dao"

import * as dotenv from "dotenv"
import * as fs from "fs"

dotenv.config()

const BUCKET: string = process.env.AWS_S3_BUCKET ?? "heavenly-gumption"

const s3 = new S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET
})

async function getClipFromS3(clip: Clip): Promise<Buffer> {
    const params = {
        Bucket: BUCKET,
        Key: `clips/${clip.id}.pcm`,
        Range: `bytes=${clip.clipstart}-${clip.clipend}`
    }

    const data = await s3.getObject(params).promise()
    if (data.Body instanceof Buffer) {
        return data.Body
    } else {
        throw data.Body
    }
}

async function main() {
    const clipDao = getClipDao()
    const clips = await clipDao.getAllClips()
    
    // export all clip data to a json file
    fs.writeFileSync("clips.json", JSON.stringify(clips, null, 2))

    clips.forEach(async clip => {
        // download clip data from s3 and save it
        const buffer = await getClipFromS3(clip)
        fs.writeFileSync("clipdata/" + clip.id + ".pcm", buffer)
    })
    console.log("Saved Clips.")
}

main()