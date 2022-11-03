export type CellColor = "R" | "G" | "B"

export type Coords = [number, number]

export type Row = (CellColor | undefined)[]

export interface Board {
    rows: Row[]
}

export type Direction = "N" | "W" | "S" | "E"

export const DIRECTIONS: Direction[] = ["N", "W", "S", "E"]

export const offset = (dir: Direction): Coords => {
    if (dir === "N") {
        return [-1, 0]
    } else if (dir === "W") {
        return [0, -1]
    } else if (dir === "S") {
        return [1, 0]
    } else {
        return [0, 1]
    }
}

export const toDirection = ([fromY, fromX]: Coords, dir: Direction): Coords => {
    const [yOffset, xOffset] = offset(dir)
    return [fromY + yOffset, fromX + xOffset]
}

export const rotate = (dir: Direction, amount: number): Direction => {
    const idx = DIRECTIONS.indexOf(dir)
    let newIdx = (idx + amount) % DIRECTIONS.length
    if (newIdx < 0) {
        newIdx += DIRECTIONS.length
    }
    return DIRECTIONS[newIdx]
}

export const toRight = (dir: Direction): Direction => rotate(dir, -1)
export const toLeft = (dir: Direction): Direction => rotate(dir, 1)

export type CoordsStr = string

const coordsToString = ([y, x]: Coords): CoordsStr => `${y},${x}`

export interface Robot {
    position: Coords
    direction: Direction
}

export interface GameState {
    board: Board
    robot: Robot
    stars: Set<CoordsStr>
}

export const cloneBoard = (board: Board): Board => {
    const newRows = board.rows.map(row => [...row])
    return { rows: newRows }
}

export const cloneRobot = (robot: Robot): Robot => {
    return {
        position: [...robot.position],
        direction: robot.direction
    }
}

export const cloneGameState = (gameState: GameState): GameState => {
    return {
        board: cloneBoard(gameState.board),
        robot: cloneRobot(gameState.robot),
        stars: new Set(gameState.stars),
    }
}

export type Condition = CellColor | undefined

export interface FunctionCallOperation {
    type: "function-call"
    functionNumber: number
}

export interface MoveOperation {
    type: "move"
    where: "forward" | "left" | "right"
}

export interface ColorChangeOperation {
    type: "color-change"
    toColor: CellColor
}

export type Operation = FunctionCallOperation | MoveOperation | ColorChangeOperation

export interface Instruction {
    operation: Operation
    condition?: Condition
}

const CONDITIONS: Condition[] = ["R", "G", "B", undefined];

export const createInstructionSet = (
    functionCount: number,
    allowedColorChanges: CellColor[] = []): Instruction[] => {
        const instructions: Instruction[] = []
        for (const condition of CONDITIONS) {
            instructions.push({ condition, operation: { type: "move", where: "forward" }})
            instructions.push({ condition, operation: { type: "move", where: "left"    }})
            instructions.push({ condition, operation: { type: "move", where: "right"   }})
            for (const toColor of allowedColorChanges) {
                instructions.push({ condition, operation: { type: "color-change", toColor }})
            }
            for (let i = 1; i <= functionCount; i++) {
                instructions.push({ condition, operation: { type: "function-call", functionNumber: i} })
            }
        }
        return instructions
}

export type GameFunction = (Instruction | undefined)[]

export interface RunContext {
    functionIndex: number
    instructionIndex: number
}

const getCurrentCellColor = (gameState: GameState): CellColor | undefined => {
    const [y, x] = gameState.robot.position;
    return gameState.board.rows[y][x]
}

const isRobotOutsideValidTiles = (gameState: GameState): boolean =>
    !!getCurrentCellColor(gameState)

/**
 * Execute a set of instructions for a game and return `true` if the game was solved.
 */
export const execute = (initialGameState: GameState, fns: GameFunction[]): boolean => {
    const stack: RunContext[] = [{functionIndex: 0, instructionIndex: 0}]
    const gameState = cloneGameState(initialGameState)

    while (stack.length > 0) {
        if (gameState.stars.size === 0) {
            return true
        }

        const rc = stack.pop()
        if (!rc) continue;
        const fn = fns[rc.functionIndex]

        if (fn.length > rc.instructionIndex + 1) {
            stack.push({
                functionIndex: rc.functionIndex,
                instructionIndex: rc.instructionIndex + 1
            })
        }

        const instruction = fn[rc.instructionIndex]
        if (!instruction) {
            continue
        }

        if (instruction.condition !== undefined &&
            getCurrentCellColor(gameState) != instruction.condition) {
            // skip conditional instruction
            continue;
        }

        const op = instruction.operation

        if (op.type === "function-call") {
            stack.push({
                functionIndex: op.functionNumber,
                instructionIndex: 0
            })
        } else if (op.type === "color-change") {
            const [y, x] = gameState.robot.position
            gameState.board.rows[y][x] = op.toColor
        } else if (op.type === "move") {
            if (op.where === "forward") {
                const { robot } = gameState
                robot.position = toDirection(robot.position, robot.direction)
                if (isRobotOutsideValidTiles(gameState)) {
                    return false
                }
                const posStr = coordsToString(robot.position)
                const starObtained = gameState.stars.delete(posStr)
                if (starObtained && gameState.stars.size === 0) {
                    return true
                }
            } else if (op.where === "left") {
                gameState.robot.direction = toLeft(gameState.robot.direction)
            } else {
                gameState.robot.direction = toRight(gameState.robot.direction)
            }
        }
    }

    return false
}
