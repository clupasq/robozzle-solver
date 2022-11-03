import {exec} from "child_process"
import {Board, CellColor, GameState, Row, execute, Instruction, CONSOLE_LOGGER} from "./GameState"

const parseCell = (cellStr: string): CellColor | undefined => {
    if (cellStr === "R" || cellStr === "G" || cellStr === "B") {
        return cellStr
    }
    if (cellStr === " ") {
        return undefined
    }
    throw new Error(`Unknown cell character: {cellStr}`)
}

const parseBoard = (boardStr: string): Board => {
    const rows: Row[] = []
    let rowSize: number | undefined;
    for (const strRow of boardStr.split("\n")) {
        if (rowSize === undefined) {
            rowSize = strRow.length
        } else {
            if (rowSize !== strRow.length) {
                throw new Error(
                    `Inconsistent row length: expected ${rowSize}, ` +
                    `but got ${strRow.length}`)
            }
        }

        const row: Row = []
        rows.push(row)
        for (const c of strRow) {
            row.push(parseCell(c))
        }
    }

    return { rows }
}


// const level: GameState = {
//     board: parseBoard(
//         "   \n" +
//         "BBB\n" +
//         "   "),
//     robot: {
//         position: [1, 0],
//         direction: "E"
//     },
//     stars: new Set(["1,2"])
// }

const level: GameState = {
    board: parseBoard(
        "BBB\n" +
        "B B\n" +
        "B B"),
    robot: {
        position: [2, 0],
        direction: "N"
    },
    stars: new Set(["2,2"])
}

const instructions: Instruction[] = [
    { condition: "B", operation: { type: "move", where: "forward" } },
    { condition: "B", operation: { type: "move", where: "forward" } },
    { condition: "B", operation: { type: "move", where: "right" } },
    { condition: "B", operation: { type: "function-call", functionNumber: 0 } }
]

const result = execute(level, [instructions], CONSOLE_LOGGER)
console.log(result)
