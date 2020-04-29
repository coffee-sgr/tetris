class GameView implements GameBoardDelegate {
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    activeBlock!: Block
    promptTextElem: HTMLElement
    scoreTextElem: HTMLElement
    lineCounterElem: HTMLElement
    board: GameBoard
    blockGenerator: BlockGenerator

    events: Queue<GameEvent> = new Queue()
    gamePaused: boolean = false
    frames = 0 // How many frames has passed
    dropTimer = 0
    hardDropTimer: number | null = null
    holdBlock: BlockName | null = null
    usedHold = false
    totalScore = 0
    totalLines = 0
    promptTimer = 0
    renCount = 0

    static getImage(blockName: BlockName) {
        return document.getElementById(blockName + "-block") as HTMLImageElement
    }

    constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
        this.canvas = canvas
        this.ctx = ctx
        this.promptTextElem = document.getElementById("prompt-text") as HTMLElement
        this.scoreTextElem = document.getElementById("score-text") as HTMLElement
        this.lineCounterElem = document.getElementById("line-counter") as HTMLElement
        this.blockGenerator = new BlockGenerator()

        // initialize board
        this.board = []
        for (let i = 0; i < GameSettings.rowNum; i++) {
            this.board.push([])
            for (let j = 0; j < GameSettings.colNum; j++) {
                this.board[i].push(null)
            }
        }
    }

    grid(x: number, y: number): [number, number, number, number] {
        return [
            this.canvas.width / GameSettings.colNum * y,
            this.canvas.height / GameSettings.rowNum * x,
            this.canvas.width / GameSettings.colNum * (y + 1),
            this.canvas.height / GameSettings.rowNum * (x + 1),
        ]
    }
    flush() {
        this.ctx.fillStyle = "#000000"
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    }

    drawBoard() {
        for (let i = 0; i < GameSettings.rowNum; i++) {
            for (let j = 0; j < GameSettings.colNum; j++) {
                let block = this.board[i][j]
                if (block) {
                    let [xpos, ypos] = this.grid(i, j)
                    this.ctx.drawImage(GameView.getImage(block), xpos, ypos)
                }
            }
        }
    }
    toggleGamePaused() {
        this.gamePaused = !this.gamePaused
    }
    /**
     * Checks on all special clears. Invalidates the block argument.
     */
    dropAndClear(): number {
        const block = this.activeBlock
        const board = this.board

        block.hardDrop()
        this.usedHold = false

        let isTSpin = false
        // T-spin check
        if (block.name === "t") {
            if (block.rotation === "2") {
                // T2
                // assumes valid position because of _CanBeAt
                isTSpin = (board[block.x + 1][block.y] !== null ||
                    board[block.x + 1][block.y + 2] !== null)
            } else if (block.rotation === "1") {
                // T3
                isTSpin = (board[block.x + 1][block.y + 2] !== null)
            } else if (block.rotation === "3") {
                isTSpin = (board[block.x + 1][block.y] !== null)
            }
        }
        // Clear board
        let clearedLines = 0
        for (let x = 0; x < GameSettings.rowNum; x++) {
            let full = true
            for (let y = 0; y < GameSettings.colNum; y++) {
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
                clearedLines++
            }
        }
        if (clearedLines > 0) {
            let promptText = ""
            // Normal Clear
            let score: number = ({
                1: 100,
                2: 200,
                3: 500,
                4: 1000,
            } as any)[clearedLines]
            this.renCount++
            if (this.renCount > 1) {
                promptText = `Ren ${this.renCount}!`
                score += this.renCount * 100
            }
            if (clearedLines === 4) {
                promptText = "Tetris!"
            }
            // T-spin
            if (isTSpin) {
                if (clearedLines === 2) {
                    promptText = "T-spin Double!"
                    score = 1000
                } else if (clearedLines === 3) {
                    promptText = "T-spin Triple!"
                    score = 1500
                } else {
                    promptText = "T-spin!"
                }
            }
            this.totalScore += score
            this.totalLines += clearedLines
            this.scoreTextElem.textContent = this.totalScore.toString()
            this.lineCounterElem.textContent = this.totalLines.toString()
            if (promptText.length > 0) {
                this.promptTextElem.textContent = promptText
                this.promptTimer = this.frames
            }
        } else {
            this.renCount = 0
        }
        return clearedLines
    }
    createBlock() {
        return new Block(this, this.blockGenerator.getNextBlock())
    }
    handleEvent(event: GameEvent) {
        switch (event) {
            case GameEvent.holdBlock:
                if (!this.usedHold) {
                    if (this.holdBlock) {
                        let tmp = this.holdBlock
                        this.holdBlock = this.activeBlock.name
                        this.activeBlock = new Block(this, tmp)
                    } else {
                        this.holdBlock = this.activeBlock.name
                        this.activeBlock = this.createBlock()
                    }
                    this.usedHold = true;
                    (document.getElementById("hold-img") as HTMLImageElement).src = "assets/" + this.holdBlock + "-shape.png"
                }
                break
            case GameEvent.moveLeft:
                this.activeBlock.move(0, -1)
                break
            case GameEvent.moveRight:
                this.activeBlock.move(0, 1)
                break
            case GameEvent.drop:
                this.activeBlock.move(1, 0)
                break
            case GameEvent.rotateLeft:
                this.activeBlock.rotate("left")
                break
            case GameEvent.rotateRight:
                this.activeBlock.rotate("right")
                break
            case GameEvent.hardDrop:
                this.dropAndClear()
                this.activeBlock = this.createBlock()
                break
            default:
                break
        }
    }
    run() {
        this.activeBlock = this.createBlock()
        setInterval(() => {
            if (this.gamePaused) { return }
            this.flush()
            // handle events
            while (!this.events.isEmpty()) {
                let event = this.events.pop()
                if (event !== undefined) { this.handleEvent(event) }
            }
            this.frames++
            if (this.frames - this.dropTimer >= GameSettings.dropSpeed) {
                this.activeBlock.move(1, 0)
                this.dropTimer = this.frames
            }
            let [shadowX, shadowY] = this.activeBlock.shadowPosition()
            if (this.activeBlock.x == shadowX && this.activeBlock.y == shadowY) {
                // at bottom
                if (this.hardDropTimer && this.frames - this.hardDropTimer >= GameSettings.hardDropLife) {
                    // should hard drop
                    this.dropAndClear()
                    this.activeBlock = this.createBlock()
                    this.hardDropTimer = null
                } else if (this.hardDropTimer === null) {
                    this.hardDropTimer = this.frames
                }
            } else {
                // never hard drop unless the block is at the bottom
                this.hardDropTimer = null
            }
            if (this.frames - this.promptTimer >= GameSettings.promptTextLife) {
                this.promptTextElem.textContent = ""
            }
            if (!this.activeBlock.legalPosition(this.activeBlock.rotation, this.activeBlock.x, this.activeBlock.y)) {
                // Game Over
                this.promptTextElem.innerHTML = "GAME OVER<br>Reload to play again "
                this.promptTextElem.style.color = "red"
                this.gamePaused = true
                this.toggleGamePaused = () => { }
            }
            this.drawBoard()

            // don't let shadow block itself
            this.activeBlock.drawShadow()
            this.activeBlock.draw()
        }, 1000 / GameSettings.fps)
    }
}
