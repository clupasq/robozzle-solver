import axios from "axios"
import {promises as fsPromises} from "fs"
import path from "path"
import {XMLParser} from "fast-xml-parser"
import {createInstructionSet, coordsToString, Level, Row} from "./GameState"

const downloadLevelAsXmlString = async (levelNo: number): Promise<string> => {
    const response = await axios({
        method: "POST",
        url: "http://www.robozzle.com/RobozzleService.svc",
        data: `<?xml version="1.0" encoding="UTF-8"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
    <soap:Body>
        <GetLevel xmlns="http://tempuri.org/">
            <levelId>${levelNo}</levelId>
        </GetLevel>
    </soap:Body>
</soap:Envelope>
`,
        responseType: "text",
        headers: {
            "Content-Type": "text/xml; charset=UTF-8",
            "SOAPAction": "http://tempuri.org/IRobozzleService/GetLevel",
        }
    })

    return response.data
}

/*
{
  "a:About": "",
  "a:AllowedCommands": 1,
  "a:Colors": {
    "b:string": [
      "RRRRRRRRRRRRRRRR",
      "RRRRRRRRRRRRRRRR",
      "RRRRRRRGRRRRRRRR",
      "RRRRRRRBRRRRRRRR",
      "RRRRRRRBRRRRRRRR",
      "RRRRRRRBRRRRRRRR",
      "RRRGBBBBBBBGRRRR",
      "RRRRRRRBRRRRRRRR",
      "RRRRRRRBRRRRRRRR",
      "RRRRRRRBRRRRRRRR",
      "RRRRRRRGRRRRRRRR",
      "RRRRRRRRRRRRRRRR"
    ]
  },
  "a:CommentCount": 0,
  "a:DifficultyVoteCount": 233,
  "a:DifficultyVoteSum": 384,
  "a:Disliked": 15,
  "a:Featured": false,
  "a:Id": 1251,
  "a:Items": {
    "b:string": [
      "################",
      "################",
      "#######*########",
      "#######*########",
      "#######*########",
      "#######*########",
      "###****.****####",
      "#######*########",
      "#######*########",
      "#######*########",
      "#######*########",
      "################"
    ]
  },
  "a:Liked": 197,
  "a:RobotCol": 7,
  "a:RobotDir": 2,
  "a:RobotRow": 6,
  "a:Solutions": 3099,
  "a:SubLengths": {
    "b:int": [
      2,
      5,
      0,
      0,
      0
    ]
  },
  "a:SubmittedBy": "beko",
  "a:SubmittedDate": "2009-09-02T14:50:08.61",
  "a:Title": "Big plus"
}
*/

const downloadLevel = async (levelNo: number): Promise<Level> => {
    const levelXmlString = await downloadLevelAsXmlString(levelNo)
    const parser = new XMLParser()
    const parsed = parser.parse(levelXmlString)
    const levelData = parsed["s:Envelope"]["s:Body"]["GetLevelResponse"]["GetLevelResult"]

    // console.log(JSON.stringify(levelData, null, 2))

    const colorMask = levelData["a:Colors"]["b:string"]
    const itemMask = levelData["a:Items"]["b:string"]

    const rows: Row[] = []
    const stars = new Set<string>()

    for (let y = 0; colorMask[y] !== undefined; y++) {
        const rowStr = colorMask[y]
        const row: Row = []
        rows.push(row)
        for (let x = 0; x < rowStr.length; x++) {
            const item = itemMask[y][x]
            if (item === "#") {
                row.push(undefined)
                continue
            }
            if (item === "*") {
                stars.add(coordsToString([y, x]))
            }
            const cell = rowStr[x]
            if (cell !== "R" && cell !== "G" && cell !== "B") {
                throw new Error(`Unknown cell color: ${cell}`)
            }
            row.push(cell)
        }
    }

    const functionLengths = levelData["a:SubLengths"]["b:int"].filter((l: number) => l > 0)
    const directionInt: number = levelData["a:RobotDir"]
    const directionStr: string = "ESWN"[directionInt]
    if (directionStr !== "N" && directionStr !== "E" && directionStr !== "S" && directionStr !== "W") {
        throw new Error(`Unknown direction: ${directionStr}`)
    }

    const level: Level = {
        id: levelData["a:Id"],
        name: levelData["a:Title"],
        initialState: {
            board: { rows },
            robot: {
                position: [
                    levelData["a:RobotRow"],
                    levelData["a:RobotCol"]
                ],
                direction: directionStr
            },
            stars
        },
        allowedInstructions: createInstructionSet(functionLengths.length, [] /* TODO */),
        functionLengths
    }

    console.info(`Downloaded level ${level.id}.`)
    return level
}

const CACHE_DIR = "./levels"

const getLevelCachePath = (levelNo: number) => path.join(CACHE_DIR, `${levelNo}.json`)

const loadLevelFromCache = async (levelNo: number): Promise<Level | undefined> => {
    try {
        const levelJson = await fsPromises.readFile(getLevelCachePath(levelNo), { encoding: "utf8" })
        const level: Level = JSON.parse(levelJson)
        console.info(`Loaded level ${level.id} from cache.`)
    } catch (e: any) {
        if ((e?.message ?? "").toString().match(/^Unexpected.*JSON/)) {
            throw e
        }
        return undefined
    }
}

const saveLevelToCache = async (level: Level): Promise<void> => {
    try {
        await fsPromises.writeFile(
            getLevelCachePath(level.id),
            JSON.stringify(level, null, 2),
            { encoding: "utf8" })
        console.info(`Saved level ${level.id} to cache.`)
    } catch (e: any) {
        console.log(e.message)
        if ((e?.message ?? "").toString().match(/^Unexpected.*JSON/)) {
            throw e
        }
        return undefined
    }
}

export const getLevel = async (levelNo: number): Promise<Level> => {
    const fromCache = await loadLevelFromCache(levelNo)
    if (fromCache) {
        return fromCache
    }
    const downloaded = await downloadLevel(levelNo)
    await saveLevelToCache(downloaded)
    return downloaded
}
