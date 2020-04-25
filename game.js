"use strict";
// Compile using TypeScript 3.8.3
function shuffleArray(arr) {
    for (var i = 0; i < arr.length; i++) {
        var index = i + Math.floor(Math.random() * (arr.length - i - 1)); // pick one from other elements
        var tmp = arr[i];
        arr[i] = arr[index];
        arr[index] = tmp;
    }
}
/**
 * Main Function
 */
window.addEventListener("load", function () {
    var blockNames = ["i", "j", "l", "o", "s", "t", "z"];
    var Queue = /** @class */ (function () {
        function Queue() {
            this.data = [];
        }
        Queue.prototype.push = function (x) {
            this.data.push(x);
        };
        Queue.prototype.pop = function () {
            return this.data.shift();
        };
        Queue.prototype.isEmpty = function () {
            return this.data.length == 0;
        };
        return Queue;
    }());
    var ActiveBlock = /** @class */ (function () {
        function ActiveBlock(block, board) {
            this.rotation = "0";
            this.x = 0;
            this.y = 4;
            this.name = block;
            this.board = board;
        }
        ActiveBlock.prototype._canBeAt = function (rotation, toX, toY) {
            var shape = blockShapes[this.name][rotation];
            for (var dx = 0; dx < shape.length; dx++) {
                for (var dy = 0; dy < shape[dx].length; dy++) {
                    var x1 = toX + dx, y1 = toY + dy;
                    if (shape[dx][dy] === "*" && ((!isInBound(x1, y1)) || this.board[x1][y1])) {
                        // out of bound or collision
                        return false;
                    }
                }
            }
            return true;
        };
        ActiveBlock.prototype.canMoveTo = function (toX, toY) {
            return this._canBeAt(this.rotation, toX, toY);
        };
        ActiveBlock.prototype.rotate = function (dir) {
            var target;
            if (dir === "left") {
                // Add 4 to avoid (-1 % 4 => -1)
                target = ((parseInt(this.rotation) - 1 + 4) % 4).toString();
            }
            else {
                target = ((parseInt(this.rotation) + 1) % 4).toString();
            }
            for (var _i = 0, _a = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]; _i < _a.length; _i++) {
                var delta = _a[_i];
                var dx = delta[0], dy = delta[1];
                if (this._canBeAt(target, this.x + dx, this.y + dy)) {
                    this.rotation = target;
                    this.x = this.x + dx;
                    this.y = this.y + dy;
                    return true;
                }
            }
            return false;
        };
        ActiveBlock.prototype.move = function (dx, dy) {
            var toX = this.x + dx, toY = this.y + dy;
            if (this.canMoveTo(toX, toY)) {
                this.x = toX;
                this.y = toY;
                return true;
            }
            return false;
        };
        ActiveBlock.prototype.draw = function (ctx) {
            var shape = blockShapes[this.name][this.rotation];
            for (var dx = 0; dx < shape.length; dx++) {
                for (var dy = 0; dy < shape[dx].length; dy++) {
                    if (shape[dx][dy] === "*") {
                        var x1 = this.x + dx, y1 = this.y + dy;
                        var _a = grid(x1, y1), xpos = _a[0], ypos = _a[1];
                        ctx.drawImage(getImage(this.name), xpos, ypos);
                    }
                }
            }
        };
        ActiveBlock.prototype.shadowPosition = function () {
            var ret = [this.x, this.y];
            for (var dx = 0; dx < rowNum; dx++) {
                // move down by 1
                var _a = [this.x + dx, this.y], toX = _a[0], toY = _a[1];
                if (!(this.canMoveTo(toX, toY))) {
                    break;
                }
                ret = [toX, toY];
            }
            return ret;
        };
        ActiveBlock.prototype.drawShadow = function (ctx) {
            ctx.globalAlpha = 0.4;
            var shape = blockShapes[this.name][this.rotation];
            var _a = this.shadowPosition(), x = _a[0], y = _a[1];
            for (var dx = 0; dx < shape.length; dx++) {
                for (var dy = 0; dy < shape[dx].length; dy++) {
                    if (shape[dx][dy] === "*") {
                        var x1 = x + dx, y1 = y + dy;
                        var _b = grid(x1, y1), xpos = _b[0], ypos = _b[1];
                        ctx.drawImage(getImage(this.name), xpos, ypos);
                    }
                }
            }
            ctx.globalAlpha = 1;
        };
        /**
         * Invalidates the object
         * @param board The game board
         */
        ActiveBlock.prototype.hardDrop = function (board) {
            var _a = this.shadowPosition(), x = _a[0], y = _a[1];
            this.x = x;
            this.y = y;
            var shape = blockShapes[this.name][this.rotation];
            for (var dx = 0; dx < shape.length; dx++) {
                for (var dy = 0; dy < shape[dx].length; dy++) {
                    if (shape[dx][dy] === "*") {
                        board[x + dx][y + dy] = this.name;
                    }
                }
            }
        };
        return ActiveBlock;
    }());
    var GameEvent;
    (function (GameEvent) {
        GameEvent[GameEvent["moveLeft"] = 0] = "moveLeft";
        GameEvent[GameEvent["moveRight"] = 1] = "moveRight";
        GameEvent[GameEvent["rotateLeft"] = 2] = "rotateLeft";
        GameEvent[GameEvent["rotateRight"] = 3] = "rotateRight";
        GameEvent[GameEvent["drop"] = 4] = "drop";
        GameEvent[GameEvent["hardDrop"] = 5] = "hardDrop";
        GameEvent[GameEvent["holdBlock"] = 6] = "holdBlock";
    })(GameEvent || (GameEvent = {}));
    var gameSettings = {
        fps: 30,
        // Number of rows and columns
        gridSize: [20, 10],
        // Time interval between block drop in frames
        dropSpeed: 30,
        // How long a block can stay active after touching the bottom in frames
        hardDropLife: 30,
        // How long the prompt text (e.g. tetris) can stay active
        promptTextLife: 45,
    };
    var canvas = document.getElementById("game-window");
    var ctx = canvas.getContext("2d");
    var _a = gameSettings.gridSize, rowNum = _a[0], colNum = _a[1];
    var gridSize = [canvas.width / colNum, canvas.height / rowNum];
    // set the size of block images
    blockNames.forEach(function (element) {
        getImage(element).width = gridSize[0];
        getImage(element).height = gridSize[1];
    });
    // initialize board
    var board = [];
    for (var i = 0; i < rowNum; i++) {
        board.push([]);
        for (var j = 0; j < colNum; j++) {
            board[i].push(null);
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
    function grid(x, y) {
        return [
            canvas.width / colNum * y,
            canvas.height / rowNum * x,
            canvas.width / colNum * (y + 1),
            canvas.height / rowNum * (x + 1),
        ];
    }
    function isInBound(x, y) {
        return x >= 0 && x < rowNum && y >= 0 && y < colNum;
    }
    function getImage(blockName) {
        return document.getElementById(blockName + "-block");
    }
    function flush() {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    function drawBoard(board) {
        for (var i = 0; i < rowNum; i++) {
            for (var j = 0; j < colNum; j++) {
                var block = board[i][j];
                if (block) {
                    var _a = grid(i, j), xpos = _a[0], ypos = _a[1];
                    ctx.drawImage(getImage(block), xpos, ypos);
                }
            }
        }
    }
    var totalScore = 0;
    var promptTimer = 0;
    var renCount = 0;
    /**
     * Checks on all special clears. Invalidates the block argument.
     * @param block Active block
     * @param board Game board
     */
    function dropAndClear(block, board) {
        block.hardDrop(board);
        usedHold = false;
        var isTSpin = false;
        // T-spin check
        if (block.name === "t") {
            if (block.rotation === "2") {
                // T2
                // assumes valid position because of _CanBeAt
                isTSpin = (board[block.x + 1][block.y] !== null ||
                    board[block.x + 1][block.y + 2] !== null);
            }
            else if (block.rotation === "1") {
                // T3
                isTSpin = (board[block.x + 1][block.y + 2] !== null);
            }
            else if (block.rotation === "3") {
                isTSpin = (board[block.x + 1][block.y] !== null);
            }
        }
        // Clear board
        var clearedRows = 0;
        for (var x = 0; x < rowNum; x++) {
            var full = true;
            for (var y = 0; y < colNum; y++) {
                if (board[x][y] === null) {
                    full = false;
                    break;
                }
            }
            if (full) {
                var emptyRow = [];
                for (var i = 0; i < 10; i++) {
                    emptyRow.push(null);
                }
                board.splice(x, 1);
                board.unshift(emptyRow);
                clearedRows++;
            }
        }
        if (clearedRows > 0) {
            var promptText = "";
            // Normal Clear
            var score = {
                1: 100,
                2: 200,
                3: 500,
                4: 1000,
            }[clearedRows];
            renCount++;
            if (renCount > 1) {
                promptText = "Ren " + renCount + "!";
                score += renCount * 100;
            }
            if (clearedRows === 4) {
                promptText = "Tetris!";
            }
            // T-spin
            if (isTSpin) {
                if (clearedRows === 2) {
                    promptText = "T-spin Double!";
                    score = 1000;
                }
                else if (clearedRows === 3) {
                    promptText = "T-spin Triple!";
                    score = 1500;
                }
                else {
                    promptText = "T-spin!";
                }
            }
            totalScore += score;
            scoreTextElem.textContent = totalScore.toString();
            if (promptText.length > 0) {
                promptTextElem.textContent = promptText;
                promptTimer = frames;
            }
        }
        else {
            renCount = 0;
        }
        return clearedRows;
    }
    var gamePaused = false;
    function toggleGamePaused() {
        gamePaused = !gamePaused;
    }
    var events = new Queue();
    document.addEventListener("keydown", function (event) {
        switch (event.keyCode) {
            case 16:
                // lshift
                events.push(GameEvent.holdBlock);
                break;
            case 27:
                // esc
                toggleGamePaused();
                break;
            case 32:
                // space bar
                events.push(GameEvent.hardDrop);
                break;
            case 37:
                // left arrow key
                events.push(GameEvent.moveLeft);
                break;
            case 38:
                // up arrow key
                events.push(GameEvent.rotateRight);
                break;
            case 39:
                // right arrow key
                events.push(GameEvent.moveRight);
                break;
            case 40:
                // down arrow key
                events.push(GameEvent.drop);
                break;
            case 90:
                // z
                events.push(GameEvent.rotateLeft);
                break;
            case 88:
                // x
                events.push(GameEvent.rotateRight);
                break;
            default:
                console.log("pressed: " + event.keyCode);
                break;
        }
    });
    console.log("Game loaded");
    // random board for testing
    // for (let i = 0; i < rowNum; i++) {
    //     for (let j = 0; j < colNum; j++) {
    //         let index = Math.floor(Math.random() * 7)
    //         board[i][j] = blockNames[index]
    //     }
    // }
    var bag = [];
    var getNextBlock = function () {
        if (bag.length < 3) {
            var newBag = blockNames.slice(); // copys the array
            shuffleArray(newBag);
            bag = bag.concat(newBag);
        }
        var ret = bag.shift();
        var next1 = bag[0], next2 = bag[1];
        document.getElementById("next1").src = "assets/" + next1 + "-shape.png";
        document.getElementById("next2").src = "assets/" + next2 + "-shape.png";
        return ret;
    };
    var frames = 0; // How many frames has passed
    var dropTimer = 0;
    var hardDropTimer = null;
    var holdBlock = null;
    var usedHold = false;
    var activeBlock = new ActiveBlock(getNextBlock(), board);
    var promptTextElem = document.getElementById("prompt-text");
    var scoreTextElem = document.getElementById("score-text");
    // main
    setInterval(function () {
        if (gamePaused) {
            return;
        }
        flush();
        // handle events
        while (!events.isEmpty()) {
            var event_1 = events.pop();
            switch (event_1) {
                case GameEvent.holdBlock:
                    if (!usedHold) {
                        if (holdBlock) {
                            var tmp = holdBlock;
                            holdBlock = activeBlock.name;
                            activeBlock = new ActiveBlock(tmp, board);
                        }
                        else {
                            holdBlock = activeBlock.name;
                            activeBlock = new ActiveBlock(getNextBlock(), board);
                        }
                        usedHold = true;
                        document.getElementById("hold-img").src = "assets/" + holdBlock + "-shape.png";
                    }
                    break;
                case GameEvent.moveLeft:
                    activeBlock.move(0, -1);
                    break;
                case GameEvent.moveRight:
                    activeBlock.move(0, 1);
                    break;
                case GameEvent.drop:
                    activeBlock.move(1, 0);
                    break;
                case GameEvent.rotateLeft:
                    activeBlock.rotate("left");
                    break;
                case GameEvent.rotateRight:
                    activeBlock.rotate("right");
                    break;
                case GameEvent.hardDrop:
                    dropAndClear(activeBlock, board);
                    activeBlock = new ActiveBlock(getNextBlock(), board);
                    break;
                default:
                    break;
            }
        }
        frames++;
        if (frames - dropTimer >= gameSettings.dropSpeed) {
            activeBlock.move(1, 0);
            dropTimer = frames;
        }
        var _a = activeBlock.shadowPosition(), shadowX = _a[0], shadowY = _a[1];
        if (activeBlock.x == shadowX && activeBlock.y == shadowY) {
            // at bottom
            if (hardDropTimer && frames - hardDropTimer >= gameSettings.hardDropLife) {
                // should hard drop
                dropAndClear(activeBlock, board);
                activeBlock = new ActiveBlock(getNextBlock(), board);
                hardDropTimer = null;
            }
            else if (hardDropTimer === null) {
                hardDropTimer = frames;
            }
        }
        else {
            // never hard drop unless the block is at the bottom
            hardDropTimer = null;
        }
        if (frames - promptTimer >= gameSettings.promptTextLife) {
            promptTextElem.textContent = "";
        }
        drawBoard(board);
        // don't let shadow block itself
        activeBlock.drawShadow(ctx);
        activeBlock.draw(ctx);
    }, 1000 / gameSettings.fps);
});
