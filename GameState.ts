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
    console.log(offset(dir))
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
    const row = gameState.board.rows[y]
    if (!row) {
        return undefined
    }
    return gameState.board.rows[y][x]
}

const isRobotOutsideValidTiles = (gameState: GameState): boolean =>
    !getCurrentCellColor(gameState)

export interface Logger {
    info: (str: string) => void
}

const NO_LOGGER: Logger = {
    info: (s: string) => {}
}

export const CONSOLE_LOGGER: Logger = {
    info: (s) => console.info(s)
}

/**
 * Execute a set of instructions for a game and return `true` if the game was solved.
 */
export const execute = (
    initialGameState: GameState,
    fns: GameFunction[],
    logger: Logger = NO_LOGGER): boolean => {
    const stack: RunContext[] = [{functionIndex: 0, instructionIndex: 0}]
    const gameState = cloneGameState(initialGameState)

    while (stack.length > 0) {
        const { robot } = gameState
        logger.info(`Current state: robot at ${coordsToString(robot.position)} (heading ${robot.direction})`)
        if (gameState.stars.size === 0) {
            return true
        }

        const rc = stack.pop()
        if (!rc) {
            logger.info("No-op. Skipping...")
            continue;
        }
        const fn = fns[rc.functionIndex]

        if (fn.length > rc.instructionIndex + 1) {
            logger.info("Queuing up next instruction from same function")
            stack.push({
                functionIndex: rc.functionIndex,
                instructionIndex: rc.instructionIndex + 1
            })
        }

        const instruction = fn[rc.instructionIndex]
        if (!instruction) {
            continue
        }

        const currentCellColor = getCurrentCellColor(gameState)

        if (instruction.condition !== undefined &&
            currentCellColor != instruction.condition) {
            logger.info(`Skipping ${instruction.condition} instruction on ${currentCellColor}`)
            continue;
        }

        const op = instruction.operation
        logger.info(`Executing: ${JSON.stringify(op)}`)

        if (op.type === "function-call") {
            stack.push({
                functionIndex: op.functionNumber,
                instructionIndex: 0
            })
        } else if (op.type === "color-change") {
            const [y, x] = robot.position
            gameState.board.rows[y][x] = op.toColor
        } else if (op.type === "move") {
            if (op.where === "forward") {
                robot.position = toDirection(robot.position, robot.direction)
                if (isRobotOutsideValidTiles(gameState)) {
                    logger.info(`Went outside valid tiles, @ ${coordsToString(robot.position)}`)
                    return false
                }
                const posStr = coordsToString(robot.position)
                const starObtained = gameState.stars.delete(posStr)
                if (starObtained && gameState.stars.size === 0) {
                    logger.info("Game WON!")
                    return true
                }
            } else if (op.where === "left") {
                gameState.robot.direction = toLeft(gameState.robot.direction)
            } else {
                gameState.robot.direction = toRight(gameState.robot.direction)
            }
        }
    }

    logger.info("Ran out of instructions.")
    return false
}
