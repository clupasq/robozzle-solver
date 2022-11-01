export type Cell = "R" | "G" | "B" | " "

export type Coords = [number, number]

export type Row = Cell[]

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

export const toDirection = ([fromY, fromX]: Coords, dir: Direction) => {
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

export interface Robot {
    position: Coords
    direction: Direction
}

export interface GameState {
    board: Board
    robot: Robot
    stars: Set<Coords>
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
