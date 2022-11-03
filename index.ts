import {exec} from "child_process"
import {Board, CellColor, GameState, Row, execute, Instruction} from "./GameState"

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
                throw new Error(`Inconsistent row length: expected ${rowSize}, but got ${strRow.length}`)
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


const level: GameState = {
    board: parseBoard(
        "   \n" +
        "BBB\n" +
        "   "),
    robot: {
        position: [1, 0],
        direction: "E"
    },
    stars: new Set(["1,2"])
}

const instructions: Instruction[] = [{
    operation: { type: "move", where: "forward" }
}, {
    operation: { type: "function-call", functionNumber: 0 }
}]

const result = execute(level, [instructions])
console.log(result)


