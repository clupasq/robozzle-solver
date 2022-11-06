import {
    Board, CellColor, GameState, Row, allocateInstructions,
    execute, Instruction, CONSOLE_LOGGER, createInstructionSet, solutionAttemptToString, Level, Condition
} from "./GameState"
import {getLevel} from "./LevelDownloader"

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
    let rowSize: number | undefined
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
// const instructions: Instruction[] = [
//     { operation: { type: "move", where: "forward" } },
//     { operation: { type: "move", where: "forward" } },
//     { operation: { type: "move", where: "right" } },
//     { operation: { type: "function-call", functionNumber: 0 } }
// ]

// const level: GameState = {
//     board: parseBoard(
//         "BBB\n" +
//         "B B\n" +
//         "B B"),
//     robot: {
//         position: [2, 0],
//         direction: "N"
//     },
//     stars: new Set(["2,2"])
// }
// const instructions: Instruction[] = [
//     { condition: "B", operation: { type: "move", where: "forward" } },
//     { condition: "B", operation: { type: "move", where: "forward" } },
//     { condition: "B", operation: { type: "move", where: "right" } },
//     { condition: "B", operation: { type: "function-call", functionNumber: 0 } }
// ]

// const level: GameState = {
//     board: parseBoard(
//         "  B B B B B B  \n" +
//         "  B B B B B B  \n" +
//         "BBRBRBRBRBRBRBB\n" +
//         "  B         B  \n" +
//         "BBR         RBB\n" +
//         "  B         B  \n" +
//         "BBR         RBB\n" +
//         "  B         B  \n" +
//         "BBRBRBRBRBRBRBB\n" +
//         "  B B B B B B  \n" +
//         "  B B B B B B  "),
//     robot: {
//         position: [4, 2],
//         direction: "E"
//     },
//     stars: new Set([
//         "0,2",
//         "0,4",
//         "0,6",
//         "0,8",
//         "0,10",
//         "0,12",
//         "2,0", "2,14",
//         "4,0", "4,14",
//         "6,0", "6,14",
//         "8,0", "8,14",
//         "10,2",
//         "10,4",
//         "10,6",
//         "10,8",
//         "10,10",
//         "10,12",
//     ])
// }
// const instructions: Instruction[] = createInstructionSet(1, [])

const solveLevel = (level: Level) => {
    const sols = allocateInstructions(level.functionLengths, level.allowedInstructions)

    let attempt = 0
    for (const sol of sols) {
        attempt++
        console.log(solutionAttemptToString(sol))
        const result = execute(level.initialState, sol)
        // if (attempt > 10000) break
        if (result) {
            console.log("SOLVED: ", solutionAttemptToString(sol))
            console.log("Attempts: ", attempt)
            return
        }
    }
    console.log(`No solution after ${attempt} attemps...`)
}


const main = async () => {
    const level = await getLevel(1004)
    solveLevel(level)

    // execute(level.initialState, [[
    //     { condition: "R", operation: { type: "move", where: "forward" }},
    //     { condition: "R", operation: { type: "move", where: "left" }},
    //     { operation: { type: "move", where: "forward" }},
    //     { operation: { type: "function-call", functionNumber: 0 }},
    // ]], CONSOLE_LOGGER)

}

main()
    .then(() => console.log("Done"))
    .catch((e) => console.error(e))

