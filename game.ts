// Compile using TypeScript 3.8.3


type BlockName = "i" | "j" | "l" | "o" | "s" | "t" | "z"
// enum BlockName {
//     i, j, l, o, s, t, z
// }
type Shape = string[]
type Rotation = "0" | "1" | "2" | "3"
type BlockShapes = {
    [key in Rotation]: Shape
}
// type BlockMap = { [key in BlockName]: BlockShapes }
type BlockMap = any
type GameBoard = ((BlockName | null)[][])

function shuffleArray(arr: Array<any>) {
    for (let i = 0; i < arr.length; i++) {
        let index = i + Math.floor(Math.random() * (arr.length - i - 1)) // pick one from other elements
        let tmp = arr[i]
        arr[i] = arr[index]
        arr[index] = tmp
    }
}

/**
 * Main Function
 */
window.addEventListener("load", function () {
    const blockNames: BlockName[] = ["i", "j", "l", "o", "s", "t", "z"]

    class Queue<T> {
        data: T[] = []
        push(x: T) {
            this.data.push(x)
        }
        pop(): T | undefined {
            return this.data.shift()
        }
        isEmpty(): boolean {
            return this.data.length == 0
        }
    }
    class ActiveBlock {
        name: BlockName
        rotation: Rotation = "0"
        board: GameBoard
        x: number = 0
        y: number = 4

        constructor(block: BlockName, board: GameBoard) {
            this.name = block
            this.board = board
        }
        _canBeAt(rotation: Rotation, toX: number, toY: number): boolean {
            let shape = blockShapes[this.name][rotation]
            for (let dx = 0; dx < shape.length; dx++) {
                for (let dy = 0; dy < shape[dx].length; dy++) {
                    let x1 = toX + dx, y1 = toY + dy
                    if (shape[dx][dy] === "*" && ((!isInBound(x1, y1)) || this.board[x1][y1])) {
                        // out of bound or collision
                        return false
                    }
                }
            }
            return true
        }
        canMoveTo(toX: number, toY: number): boolean {
            return this._canBeAt(this.rotation, toX, toY)
        }
        rotate(dir: "left" | "right"): boolean {
            let target: Rotation
            if (dir === "left") {
                // Add 4 to avoid (-1 % 4 => -1)
                target = ((parseInt(this.rotation) - 1 + 4) % 4).toString() as Rotation
            } else {
                target = ((parseInt(this.rotation) + 1) % 4).toString() as Rotation
            }
            if (this._canBeAt(target, this.x, this.y)) {
                this.rotation = target
                return true
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
        draw(ctx: CanvasRenderingContext2D) {
            let shape = blockShapes[this.name][this.rotation]
            for (let dx = 0; dx < shape.length; dx++) {
                for (let dy = 0; dy < shape[dx].length; dy++) {
                    if (shape[dx][dy] === "*") {
                        let x1 = this.x + dx, y1 = this.y + dy
                        let [xpos, ypos] = grid(x1, y1)
                        ctx.drawImage(getImage(this.name), xpos, ypos)
                    }
                }
            }
        }
        shadowPosition(): [number, number] {
            let ret: [number, number] = [this.x, this.y]
            for (let dx = 0; dx < rowNum; dx++) {
                // move down by 1
                let [toX, toY] = [this.x + dx, this.y]
                if (!(this.canMoveTo(toX, toY))) {
                    break
                }
                ret = [toX, toY]
            }
            return ret
        }
        drawShadow(ctx: CanvasRenderingContext2D) {
            ctx.globalAlpha = 0.4
            let shape = blockShapes[this.name][this.rotation]
            let [x, y] = this.shadowPosition()
            for (let dx = 0; dx < shape.length; dx++) {
                for (let dy = 0; dy < shape[dx].length; dy++) {
                    if (shape[dx][dy] === "*") {
                        let x1 = x + dx, y1 = y + dy
                        let [xpos, ypos] = grid(x1, y1)
                        ctx.drawImage(getImage(this.name), xpos, ypos)
                    }
                }
            }
            ctx.globalAlpha = 1
        }

        /**
         * Invalidates the object
         * @param board The game board
         */
        hardDrop(board: GameBoard) {
            let [x, y] = this.shadowPosition()
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

    enum GameEvent {
        moveLeft,
        moveRight,
        rotateLeft,
        rotateRight,
        drop,
        hardDrop,
        holdBlock,
    }
    const gameSettings = {
        fps: 30,
        // Number of rows and columns
        gridSize: [20, 10],
        // Time interval between block drop in frames
        dropSpeed: 30,
        // How long can a block stay active after touching the bottom in frames
        hardDropLife: 30,
    }

    const canvas = document.getElementById("game-window") as HTMLCanvasElement
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D
    const [rowNum, colNum] = gameSettings.gridSize
    const gridSize: [number, number] = [canvas.width / colNum, canvas.height / rowNum]
    // set the size of block images
    blockNames.forEach(element => {
        getImage(element).width = gridSize[0]
        getImage(element).height = gridSize[1]
    })

    // initialize board
    let board: GameBoard = []
    for (let i = 0; i < rowNum; i++) {
        board.push([])
        for (let j = 0; j < colNum; j++) {
            board[i].push(null)
        }
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
    function grid(x: number, y: number): [number, number, number, number] {
        return [
            canvas.width / colNum * y,
            canvas.height / rowNum * x,
            canvas.width / colNum * (y + 1),
            canvas.height / rowNum * (x + 1),
        ]
    }
    function isInBound(x: number, y: number): boolean {
        return x >= 0 && x < rowNum && y >= 0 && y < colNum
    }
    function getImage(blockName: BlockName) {
        return document.getElementById(blockName + "-block") as HTMLImageElement
    }
    function flush() {
        ctx.fillStyle = "#000000"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    function drawBoard(board: GameBoard) {
        for (let i = 0; i < rowNum; i++) {
            for (let j = 0; j < colNum; j++) {
                let block = board[i][j]
                if (block) {
                    let [xpos, ypos] = grid(i, j)
                    ctx.drawImage(getImage(block), xpos, ypos)
                }
            }
        }
    }
    let score = 0
    function clearBoard(board: GameBoard): number {
        let cnt = 0
        for (let x = 0; x < rowNum; x++) {
            let full = true
            for (let y = 0; y < colNum; y++) {
                if (board[x][y] === null) {
                    full = false
                    break
                }
            }
            if (full) {
                let emptyRow: (BlockName | null)[] = []
                for (let i = 0; i < 10; i++) {
                    emptyRow.push(null)
                }
                board.splice(x, 1)
                board.unshift(emptyRow)
                cnt++
            }
        }
        if (cnt > 0) {
            score += ({
                1: 100,
                2: 200,
                3: 500,
                4: 1000,
            } as any)[cnt];
            (document.getElementById("score-text") as HTMLElement).textContent = score.toString()
        }
        return cnt
    }

    let gamePaused = false
    function toggleGamePaused() {
        gamePaused = !gamePaused
        console.log(`paused: ${gamePaused}`)
    }
    let events = new Queue<GameEvent>()
    document.addEventListener("keydown", (event: KeyboardEvent) => {
        switch (event.keyCode) {
            case 16:
                // lshift
                events.push(GameEvent.holdBlock)
                break
            case 27:
                // esc
                toggleGamePaused()
                break
            case 32:
                // space bar
                events.push(GameEvent.hardDrop)
                break
            case 37:
                // left arrow key
                events.push(GameEvent.moveLeft)
                break
            case 38:
                // up arrow key
                events.push(GameEvent.rotateRight)
                break
            case 39:
                // right arrow key
                events.push(GameEvent.moveRight)
                break
            case 40:
                // down arrow key
                events.push(GameEvent.drop)
                break
            case 90:
                // z
                events.push(GameEvent.rotateLeft)
                break
            case 88:
                // x
                events.push(GameEvent.rotateRight)
                break
            default:
                console.log(`pressed: ${event.keyCode}`)
                break
        }
    })
    console.log("Game loaded")

    // random board for testing
    // for (let i = 0; i < rowNum; i++) {
    //     for (let j = 0; j < colNum; j++) {
    //         let index = Math.floor(Math.random() * 7)
    //         board[i][j] = blockNames[index]
    //     }
    // }

    let bag: BlockName[] = []
    let getNextBlock = () => {
        if (bag.length < 3) {
            let newBag = blockNames.slice() // copys the array
            shuffleArray(newBag)
            bag = bag.concat(newBag)
        }
        let ret = bag.shift() as BlockName
        let next1 = bag[0], next2 = bag[1];
        (document.getElementById("next1") as HTMLImageElement).src = "assets/" + next1 + "-shape.png";
        (document.getElementById("next2") as HTMLImageElement).src = "assets/" + next2 + "-shape.png"
        return ret
    }

    let frames = 0 // How many frames has passed
    let dropTimer = 0
    let hardDropTimer: number | null = null
    let holdBlock: BlockName | null = null
    let usedHold = false
    let activeBlock = new ActiveBlock(getNextBlock(), board)
    // main
    setInterval(() => {
        if (gamePaused) { return }
        flush()
        // handle events
        while (!events.isEmpty()) {
            let event = events.pop()
            switch (event) {
                case GameEvent.holdBlock:
                    if (!usedHold) {
                        if (holdBlock) {
                            let tmp = holdBlock
                            holdBlock = activeBlock.name
                            activeBlock = new ActiveBlock(tmp, board)
                        } else {
                            holdBlock = activeBlock.name
                            activeBlock = new ActiveBlock(getNextBlock(), board)
                        }
                        usedHold = true;
                        (document.getElementById("hold-img") as HTMLImageElement).src = "assets/" + holdBlock + "-shape.png"
                    }
                    break
                case GameEvent.moveLeft:
                    activeBlock.move(0, -1)
                    break
                case GameEvent.moveRight:
                    activeBlock.move(0, 1)
                    break
                case GameEvent.drop:
                    activeBlock.move(1, 0)
                    break
                case GameEvent.rotateLeft:
                    activeBlock.rotate("left")
                    break
                case GameEvent.rotateRight:
                    activeBlock.rotate("right")
                    break
                case GameEvent.hardDrop:
                    activeBlock.hardDrop(board)
                    activeBlock = new ActiveBlock(getNextBlock(), board)
                    usedHold = false
                    break
                default:
                    break
            }
        }
        frames++
        if (frames - dropTimer >= gameSettings.dropSpeed) {
            activeBlock.move(1, 0)
            dropTimer = frames
        }
        let [shadowX, shadowY] = activeBlock.shadowPosition()
        if (activeBlock.x == shadowX && activeBlock.y == shadowY) {
            // at bottom
            if (hardDropTimer && frames - hardDropTimer >= gameSettings.hardDropLife) {
                // should hard drop
                activeBlock.hardDrop(board)
                usedHold = false
                activeBlock = new ActiveBlock(getNextBlock(), board)
                hardDropTimer = null
            } else if (hardDropTimer === null) {
                hardDropTimer = frames
            }
        } else {
            // never hard drop unless the block is at the bottom
            hardDropTimer = null
        }

        clearBoard(board)
        drawBoard(board)

        // don't let shadow block itself
        activeBlock.drawShadow(ctx)
        activeBlock.draw(ctx)
    }, 1000 / gameSettings.fps)
})
