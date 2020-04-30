/**
 * Main Function
 */
window.addEventListener("load", function () {
    let isTouchScreen = window.navigator.maxTouchPoints > 0
    // Hides touch control if doesn't support touch screen
    if (isTouchScreen) {
        const elements = document.getElementsByClassName("touch-control-zone")
        for (let i = 0; i < elements.length; i++) {
            elements[i].removeAttribute("hidden")
        }
    }



    const canvas = document.getElementById("game-window") as HTMLCanvasElement
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D
    const gameView = new GameView(canvas, ctx)
    const gridSize: [number, number] = [canvas.width / GameSettings.colNum, canvas.height / GameSettings.rowNum]
    // set the size of block images
    blockNames.forEach(element => {
        GameView.getImage(element).width = gridSize[0]
        GameView.getImage(element).height = gridSize[1]
    })
    document.addEventListener("keydown", (event: KeyboardEvent) => {
        switch (event.keyCode) {
            case 16:
                // lshift
                gameView.events.push(GameEvent.holdBlock)
                break
            case 27:
                // esc
                gameView.toggleGamePaused()
                break
            case 32:
                // space bar
                gameView.events.push(GameEvent.hardDrop)
                break
            case 37:
                // left arrow key
                gameView.events.push(GameEvent.moveLeft)
                break
            case 38:
                // up arrow key
                gameView.events.push(GameEvent.rotateRight)
                break
            case 39:
                // right arrow key
                gameView.events.push(GameEvent.moveRight)
                break
            case 40:
                // down arrow key
                gameView.events.push(GameEvent.drop)
                break
            case 90:
                // z
                gameView.events.push(GameEvent.rotateLeft)
                break
            case 88:
                // x
                gameView.events.push(GameEvent.rotateRight)
                break
            default:
                // console.log(`pressed: ${event.keyCode}`)
                break
        }
    })
    if (isTouchScreen) {
        document.getElementById("touch-left")?.addEventListener("touchstart", (_e) => { gameView.events.push(GameEvent.moveLeft) })
        document.getElementById("touch-right")?.addEventListener("touchstart", (_e) => { gameView.events.push(GameEvent.moveRight) })
        document.getElementById("touch-rotate-left")?.addEventListener("touchstart", (_e) => { gameView.events.push(GameEvent.rotateLeft) })
        document.getElementById("touch-rotate-right")?.addEventListener("touchstart", (_e) => { gameView.events.push(GameEvent.rotateRight) })
        document.getElementById("touch-down")?.addEventListener("touchstart", (_e) => { gameView.events.push(GameEvent.drop) })
        document.getElementById("touch-hard-drop")?.addEventListener("touchstart", (_e) => { gameView.events.push(GameEvent.hardDrop) })
        document.getElementById("touch-hold")?.addEventListener("touchstart", (_e) => { gameView.events.push(GameEvent.holdBlock) })
    }
    console.log("Game loaded")
    // main
    gameView.run()
})
