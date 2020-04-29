interface GameBoardDelegate {
    board: (BlockName | null)[][]
    ctx: CanvasRenderingContext2D
    canvas: HTMLCanvasElement
    grid(x: number, y: number): [number, number, number, number]
}

class Block {
    parent: GameBoardDelegate
    name: BlockName
    rotation: Rotation = "0"
    x: number = 0
    y: number = 3

    constructor(parent: GameBoardDelegate, block: BlockName) {
        this.parent = parent
        this.name = block
    }
    /**
    * Note that ctx defines width as x axis while the game uses height.
    * ```
    * --→ y
    * |
    * ↓
    * x
    * ```
    * @param x X Position (starting from 0)
    * @param y Y Position (starting from 0)
    * @returns `[x1, y1, x2, y2]` Upper-left corner `(x1, y1)` and Lower-right corner `(x2, y2)` for ctx (width as x axis)
    */

    static isInBound(x: number, y: number): boolean {
        return x >= 0 && x < GameSettings.rowNum && y >= 0 && y < GameSettings.colNum
    }
    legalPosition(rotation: Rotation, toX: number, toY: number): boolean {
        let shape = blockShapes[this.name][rotation]
        for (let dx = 0; dx < shape.length; dx++) {
            for (let dy = 0; dy < shape[dx].length; dy++) {
                let x1 = toX + dx, y1 = toY + dy
                if (shape[dx][dy] === "*" && ((!Block.isInBound(x1, y1)) || this.parent.board[x1][y1])) {
                    // out of bound or collision
                    return false
                }
            }
        }
        return true
    }
    canMoveTo(toX: number, toY: number): boolean {
        return this.legalPosition(this.rotation, toX, toY)
    }
    rotate(dir: "left" | "right"): boolean {
        let target: Rotation
        if (dir === "left") {
            // Add 4 to avoid (-1 % 4 => -1)
            target = ((parseInt(this.rotation) - 1 + 4) % 4).toString() as Rotation
        } else {
            target = ((parseInt(this.rotation) + 1) % 4).toString() as Rotation
        }
        for (let delta of [[0, 0], [1, 0], [1, 1], [1, -1], [2, 0], [2, 1], [2, -1], [0, 1], [0, -1], [-1, 0], [-1, 1], [-1, -1]]) {
            let [dx, dy] = delta
            if (this.legalPosition(target, this.x + dx, this.y + dy)) {
                this.rotation = target
                this.x = this.x + dx
                this.y = this.y + dy
                return true
            }
        }
        return false
    }
    move(dx: number, dy: number): boolean {
        let toX = this.x + dx, toY = this.y + dy
        if (this.canMoveTo(toX, toY)) {
            this.x = toX
            this.y = toY
            return true
        }
        return false
    }
    draw() {
        const ctx = this.parent.ctx
        let shape = blockShapes[this.name][this.rotation]
        for (let dx = 0; dx < shape.length; dx++) {
            for (let dy = 0; dy < shape[dx].length; dy++) {
                if (shape[dx][dy] === "*") {
                    let x1 = this.x + dx, y1 = this.y + dy
                    let [xpos, ypos] = this.parent.grid(x1, y1)
                    ctx.drawImage(GameView.getImage(this.name), xpos, ypos)
                }
            }
        }
    }
    shadowPosition(): [number, number] {
        let ret: [number, number] = [this.x, this.y]
        for (let dx = 0; dx < GameSettings.rowNum; dx++) {
            // move down by 1
            let [toX, toY] = [this.x + dx, this.y]
            if (!(this.canMoveTo(toX, toY))) {
                break
            }
            ret = [toX, toY]
        }
        return ret
    }
    drawShadow() {
        const ctx = this.parent.ctx
        ctx.globalAlpha = 0.4
        let shape = blockShapes[this.name][this.rotation]
        let [x, y] = this.shadowPosition()
        for (let dx = 0; dx < shape.length; dx++) {
            for (let dy = 0; dy < shape[dx].length; dy++) {
                if (shape[dx][dy] === "*") {
                    let x1 = x + dx, y1 = y + dy
                    let [xpos, ypos] = this.parent.grid(x1, y1)
                    ctx.drawImage(GameView.getImage(this.name), xpos, ypos)
                }
            }
        }
        ctx.globalAlpha = 1
    }
    /**
     * Invalidates the object
     */
    hardDrop() {
        const board = this.parent.board
        let [x, y] = this.shadowPosition()
        this.x = x
        this.y = y
        let shape = blockShapes[this.name][this.rotation]
        for (let dx = 0; dx < shape.length; dx++) {
            for (let dy = 0; dy < shape[dx].length; dy++) {
                if (shape[dx][dy] === "*") {
                    board[x + dx][y + dy] = this.name
                }
            }
        }
    }
}
