"use strict";
var Block = /** @class */ (function () {
    function Block(parent, block) {
        this.rotation = "0";
        this.x = 0;
        this.y = 3;
        this.parent = parent;
        this.name = block;
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
    Block.isInBound = function (x, y) {
        return x >= 0 && x < GameSettings.rowNum && y >= 0 && y < GameSettings.colNum;
    };
    Block.prototype.legalPosition = function (rotation, toX, toY) {
        var shape = blockShapes[this.name][rotation];
        for (var dx = 0; dx < shape.length; dx++) {
            for (var dy = 0; dy < shape[dx].length; dy++) {
                var x1 = toX + dx, y1 = toY + dy;
                if (shape[dx][dy] === "*" && ((!Block.isInBound(x1, y1)) || this.parent.board[x1][y1])) {
                    // out of bound or collision
                    return false;
                }
            }
        }
        return true;
    };
    Block.prototype.canMoveTo = function (toX, toY) {
        return this.legalPosition(this.rotation, toX, toY);
    };
    Block.prototype.rotate = function (dir) {
        var target;
        if (dir === "left") {
            // Add 4 to avoid (-1 % 4 => -1)
            target = ((parseInt(this.rotation) - 1 + 4) % 4).toString();
        }
        else {
            target = ((parseInt(this.rotation) + 1) % 4).toString();
        }
        for (var _i = 0, _a = [[0, 0], [1, 0], [1, 1], [1, -1], [2, 0], [2, 1], [2, -1], [0, 1], [0, -1], [-1, 0], [-1, 1], [-1, -1]]; _i < _a.length; _i++) {
            var delta = _a[_i];
            var dx = delta[0], dy = delta[1];
            if (this.legalPosition(target, this.x + dx, this.y + dy)) {
                this.rotation = target;
                this.x = this.x + dx;
                this.y = this.y + dy;
                return true;
            }
        }
        return false;
    };
    Block.prototype.move = function (dx, dy) {
        var toX = this.x + dx, toY = this.y + dy;
        if (this.canMoveTo(toX, toY)) {
            this.x = toX;
            this.y = toY;
            return true;
        }
        return false;
    };
    Block.prototype.draw = function (ctx) {
        var shape = blockShapes[this.name][this.rotation];
        for (var dx = 0; dx < shape.length; dx++) {
            for (var dy = 0; dy < shape[dx].length; dy++) {
                if (shape[dx][dy] === "*") {
                    var x1 = this.x + dx, y1 = this.y + dy;
                    var _a = this.parent.grid(x1, y1), xpos = _a[0], ypos = _a[1];
                    ctx.drawImage(GameView.getImage(this.name), xpos, ypos);
                }
            }
        }
    };
    Block.prototype.shadowPosition = function () {
        var ret = [this.x, this.y];
        for (var dx = 0; dx < GameSettings.rowNum; dx++) {
            // move down by 1
            var _a = [this.x + dx, this.y], toX = _a[0], toY = _a[1];
            if (!(this.canMoveTo(toX, toY))) {
                break;
            }
            ret = [toX, toY];
        }
        return ret;
    };
    Block.prototype.drawShadow = function (ctx) {
        ctx.globalAlpha = 0.4;
        var shape = blockShapes[this.name][this.rotation];
        var _a = this.shadowPosition(), x = _a[0], y = _a[1];
        for (var dx = 0; dx < shape.length; dx++) {
            for (var dy = 0; dy < shape[dx].length; dy++) {
                if (shape[dx][dy] === "*") {
                    var x1 = x + dx, y1 = y + dy;
                    var _b = this.parent.grid(x1, y1), xpos = _b[0], ypos = _b[1];
                    ctx.drawImage(GameView.getImage(this.name), xpos, ypos);
                }
            }
        }
        ctx.globalAlpha = 1;
    };
    /**
     * Invalidates the object
     * @param board The game board
     */
    Block.prototype.hardDrop = function (board) {
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
    return Block;
}());
var BlockGenerator = /** @class */ (function () {
    function BlockGenerator() {
        this.bag = [];
    }
    BlockGenerator.prototype.getNextBlock = function () {
        if (this.bag.length < 3) {
            var newBag = blockNames.slice(); // copys the array
            shuffleArray(newBag);
            this.bag = this.bag.concat(newBag);
        }
        var ret = this.bag.shift();
        var next1 = this.bag[0], next2 = this.bag[1];
        document.getElementById("next1").src = "assets/" + next1 + "-shape.png";
        document.getElementById("next2").src = "assets/" + next2 + "-shape.png";
        return ret;
    };
    return BlockGenerator;
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
var GameSettings = /** @class */ (function () {
    function GameSettings() {
    }
    GameSettings.fps = 30;
    // Number of rows and columns
    GameSettings.rowNum = 20;
    GameSettings.colNum = 10;
    // Time interval between block drop in frames
    GameSettings.dropSpeed = 30;
    // How long a block can stay active after touching the bottom in frames
    GameSettings.hardDropLife = 30;
    // How long the prompt text (e.g. tetris) can stay active
    GameSettings.promptTextLife = 45;
    return GameSettings;
}());
var GameView = /** @class */ (function () {
    function GameView(canvas, ctx) {
        this.events = new Queue();
        this.gamePaused = false;
        this.frames = 0; // How many frames has passed
        this.dropTimer = 0;
        this.hardDropTimer = null;
        this.holdBlock = null;
        this.usedHold = false;
        this.totalScore = 0;
        this.totalLines = 0;
        this.promptTimer = 0;
        this.renCount = 0;
        this.canvas = canvas;
        this.ctx = ctx;
        this.promptTextElem = document.getElementById("prompt-text");
        this.scoreTextElem = document.getElementById("score-text");
        this.lineCounterElem = document.getElementById("line-counter");
        this.blockGenerator = new BlockGenerator();
        // initialize board
        this.board = [];
        for (var i = 0; i < GameSettings.rowNum; i++) {
            this.board.push([]);
            for (var j = 0; j < GameSettings.colNum; j++) {
                this.board[i].push(null);
            }
        }
    }
    GameView.getImage = function (blockName) {
        return document.getElementById(blockName + "-block");
    };
    GameView.prototype.grid = function (x, y) {
        return [
            this.canvas.width / GameSettings.colNum * y,
            this.canvas.height / GameSettings.rowNum * x,
            this.canvas.width / GameSettings.colNum * (y + 1),
            this.canvas.height / GameSettings.rowNum * (x + 1),
        ];
    };
    GameView.prototype.flush = function () {
        this.ctx.fillStyle = "#000000";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    };
    GameView.prototype.drawBoard = function (board) {
        for (var i = 0; i < GameSettings.rowNum; i++) {
            for (var j = 0; j < GameSettings.colNum; j++) {
                var block = board[i][j];
                if (block) {
                    var _a = this.grid(i, j), xpos = _a[0], ypos = _a[1];
                    this.ctx.drawImage(GameView.getImage(block), xpos, ypos);
                }
            }
        }
    };
    GameView.prototype.toggleGamePaused = function () {
        this.gamePaused = !this.gamePaused;
    };
    /**
     * Checks on all special clears. Invalidates the block argument.
     * @param block Active block
     * @param board Game board
     */
    GameView.prototype.dropAndClear = function (block, board) {
        block.hardDrop(board);
        this.usedHold = false;
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
        var clearedLines = 0;
        for (var x = 0; x < GameSettings.rowNum; x++) {
            var full = true;
            for (var y = 0; y < GameSettings.colNum; y++) {
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
                clearedLines++;
            }
        }
        if (clearedLines > 0) {
            var promptText = "";
            // Normal Clear
            var score = {
                1: 100,
                2: 200,
                3: 500,
                4: 1000,
            }[clearedLines];
            this.renCount++;
            if (this.renCount > 1) {
                promptText = "Ren " + this.renCount + "!";
                score += this.renCount * 100;
            }
            if (clearedLines === 4) {
                promptText = "Tetris!";
            }
            // T-spin
            if (isTSpin) {
                if (clearedLines === 2) {
                    promptText = "T-spin Double!";
                    score = 1000;
                }
                else if (clearedLines === 3) {
                    promptText = "T-spin Triple!";
                    score = 1500;
                }
                else {
                    promptText = "T-spin!";
                }
            }
            this.totalScore += score;
            this.totalLines += clearedLines;
            this.scoreTextElem.textContent = this.totalScore.toString();
            this.lineCounterElem.textContent = this.totalLines.toString();
            if (promptText.length > 0) {
                this.promptTextElem.textContent = promptText;
                this.promptTimer = this.frames;
            }
        }
        else {
            this.renCount = 0;
        }
        return clearedLines;
    };
    GameView.prototype.createBlock = function () {
        return new Block(this, this.blockGenerator.getNextBlock());
    };
    GameView.prototype.handleEvent = function (event) {
        switch (event) {
            case GameEvent.holdBlock:
                if (!this.usedHold) {
                    if (this.holdBlock) {
                        var tmp = this.holdBlock;
                        this.holdBlock = this.activeBlock.name;
                        this.activeBlock = new Block(this, tmp);
                    }
                    else {
                        this.holdBlock = this.activeBlock.name;
                        this.activeBlock = this.createBlock();
                    }
                    this.usedHold = true;
                    document.getElementById("hold-img").src = "assets/" + this.holdBlock + "-shape.png";
                }
                break;
            case GameEvent.moveLeft:
                this.activeBlock.move(0, -1);
                break;
            case GameEvent.moveRight:
                this.activeBlock.move(0, 1);
                break;
            case GameEvent.drop:
                this.activeBlock.move(1, 0);
                break;
            case GameEvent.rotateLeft:
                this.activeBlock.rotate("left");
                break;
            case GameEvent.rotateRight:
                this.activeBlock.rotate("right");
                break;
            case GameEvent.hardDrop:
                this.dropAndClear(this.activeBlock, this.board);
                this.activeBlock = this.createBlock();
                break;
            default:
                break;
        }
    };
    GameView.prototype.run = function () {
        var _this = this;
        this.activeBlock = this.createBlock();
        setInterval(function () {
            if (_this.gamePaused) {
                return;
            }
            _this.flush();
            // handle events
            while (!_this.events.isEmpty()) {
                var event_1 = _this.events.pop();
                if (event_1 !== undefined) {
                    _this.handleEvent(event_1);
                }
            }
            _this.frames++;
            if (_this.frames - _this.dropTimer >= GameSettings.dropSpeed) {
                _this.activeBlock.move(1, 0);
                _this.dropTimer = _this.frames;
            }
            var _a = _this.activeBlock.shadowPosition(), shadowX = _a[0], shadowY = _a[1];
            if (_this.activeBlock.x == shadowX && _this.activeBlock.y == shadowY) {
                // at bottom
                if (_this.hardDropTimer && _this.frames - _this.hardDropTimer >= GameSettings.hardDropLife) {
                    // should hard drop
                    _this.dropAndClear(_this.activeBlock, _this.board);
                    _this.activeBlock = _this.createBlock();
                    _this.hardDropTimer = null;
                }
                else if (_this.hardDropTimer === null) {
                    _this.hardDropTimer = _this.frames;
                }
            }
            else {
                // never hard drop unless the block is at the bottom
                _this.hardDropTimer = null;
            }
            if (_this.frames - _this.promptTimer >= GameSettings.promptTextLife) {
                _this.promptTextElem.textContent = "";
            }
            if (!_this.activeBlock.legalPosition(_this.activeBlock.rotation, _this.activeBlock.x, _this.activeBlock.y)) {
                // Game Over
                _this.promptTextElem.innerHTML = "GAME OVER<br>Reload to play again ";
                _this.promptTextElem.style.color = "red";
                _this.gamePaused = true;
                _this.toggleGamePaused = function () { };
            }
            _this.drawBoard(_this.board);
            // don't let shadow block itself
            _this.activeBlock.drawShadow(_this.ctx);
            _this.activeBlock.draw(_this.ctx);
        }, 1000 / GameSettings.fps);
    };
    return GameView;
}());
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
function shuffleArray(arr) {
    for (var i = 0; i < arr.length; i++) {
        var index = i + Math.floor(Math.random() * (arr.length - i - 1)); // pick one from other elements
        var tmp = arr[i];
        arr[i] = arr[index];
        arr[index] = tmp;
    }
}
// Compile using TypeScript 3.8.3
var blockNames = ["i", "j", "l", "o", "s", "t", "z"];
var blockShapes = {
    "i": {
        "0": [
            "----",
            "****",
            "----",
            "----",
        ],
        "1": [
            "--*-",
            "--*-",
            "--*-",
            "--*-",
        ],
        "2": [
            "----",
            "----",
            "****",
            "----",
        ],
        "3": [
            "-*--",
            "-*--",
            "-*--",
            "-*--",
        ]
    },
    "j": {
        "0": [
            "----",
            "*---",
            "***-",
            "----",
        ],
        "1": [
            "----",
            "-**-",
            "-*--",
            "-*--",
        ],
        "2": [
            "----",
            "----",
            "***-",
            "--*-",
        ],
        "3": [
            "----",
            "-*--",
            "-*--",
            "**--",
        ],
    },
    "l": {
        "0": [
            "----",
            "--*-",
            "***-",
            "----",
        ],
        "1": [
            "----",
            "-*--",
            "-*--",
            "-**-",
        ],
        "2": [
            "----",
            "----",
            "***-",
            "*---",
        ],
        "3": [
            "----",
            "**--",
            "-*--",
            "-*--",
        ],
    },
    "o": {
        "0": [
            "----",
            "-**-",
            "-**-",
            "----",
        ],
        "1": [
            "----",
            "-**-",
            "-**-",
            "----",
        ],
        "2": [
            "----",
            "-**-",
            "-**-",
            "----",
        ],
        "3": [
            "----",
            "-**-",
            "-**-",
            "----",
        ],
    },
    "s": {
        "0": [
            "----",
            "-**-",
            "**--",
            "----",
        ],
        "1": [
            "----",
            "-*--",
            "-**-",
            "--*-",
        ],
        "2": [
            "----",
            "----",
            "-**-",
            "**--",
        ],
        "3": [
            "----",
            "*---",
            "**--",
            "-*--",
        ],
    },
    "t": {
        "0": [
            "----",
            "-*--",
            "***-",
            "----",
        ],
        "1": [
            "----",
            "-*--",
            "-**-",
            "-*--",
        ],
        "2": [
            "----",
            "----",
            "***-",
            "-*--",
        ],
        "3": [
            "----",
            "-*--",
            "**--",
            "-*--",
        ],
    },
    "z": {
        "0": [
            "----",
            "**--",
            "-**-",
            "----",
        ],
        "1": [
            "----",
            "--*-",
            "-**-",
            "-*--",
        ],
        "2": [
            "----",
            "----",
            "**--",
            "-**-",
        ],
        "3": [
            "----",
            "-*--",
            "**--",
            "*---",
        ],
    }
};
/**
 * Main Function
 */
window.addEventListener("load", function () {
    var _a, _b, _c, _d, _f, _g, _h, _j;
    var isTouchScreen = true;
    // Hides touch control if doesn't support touch screen
    if (window.navigator.maxTouchPoints === 0) {
        isTouchScreen = false;
        (_a = document.getElementsByClassName("touch-control-zone").item(0)) === null || _a === void 0 ? void 0 : _a.setAttribute("hidden", "hidden");
    }
    var canvas = document.getElementById("game-window");
    var ctx = canvas.getContext("2d");
    var gameView = new GameView(canvas, ctx);
    var gridSize = [canvas.width / GameSettings.colNum, canvas.height / GameSettings.rowNum];
    // set the size of block images
    blockNames.forEach(function (element) {
        GameView.getImage(element).width = gridSize[0];
        GameView.getImage(element).height = gridSize[1];
    });
    document.addEventListener("keydown", function (event) {
        switch (event.keyCode) {
            case 16:
                // lshift
                gameView.events.push(GameEvent.holdBlock);
                break;
            case 27:
                // esc
                gameView.toggleGamePaused();
                break;
            case 32:
                // space bar
                gameView.events.push(GameEvent.hardDrop);
                break;
            case 37:
                // left arrow key
                gameView.events.push(GameEvent.moveLeft);
                break;
            case 38:
                // up arrow key
                gameView.events.push(GameEvent.rotateRight);
                break;
            case 39:
                // right arrow key
                gameView.events.push(GameEvent.moveRight);
                break;
            case 40:
                // down arrow key
                gameView.events.push(GameEvent.drop);
                break;
            case 90:
                // z
                gameView.events.push(GameEvent.rotateLeft);
                break;
            case 88:
                // x
                gameView.events.push(GameEvent.rotateRight);
                break;
            default:
                // console.log(`pressed: ${event.keyCode}`)
                break;
        }
    });
    if (isTouchScreen) {
        (_b = document.getElementById("touch-left")) === null || _b === void 0 ? void 0 : _b.addEventListener("touchstart", function (_e) { gameView.events.push(GameEvent.moveLeft); });
        (_c = document.getElementById("touch-right")) === null || _c === void 0 ? void 0 : _c.addEventListener("touchstart", function (_e) { gameView.events.push(GameEvent.moveRight); });
        (_d = document.getElementById("touch-rotate-left")) === null || _d === void 0 ? void 0 : _d.addEventListener("touchstart", function (_e) { gameView.events.push(GameEvent.rotateLeft); });
        (_f = document.getElementById("touch-rotate-right")) === null || _f === void 0 ? void 0 : _f.addEventListener("touchstart", function (_e) { gameView.events.push(GameEvent.rotateRight); });
        (_g = document.getElementById("touch-down")) === null || _g === void 0 ? void 0 : _g.addEventListener("touchstart", function (_e) { gameView.events.push(GameEvent.drop); });
        (_h = document.getElementById("touch-hard-drop")) === null || _h === void 0 ? void 0 : _h.addEventListener("touchstart", function (_e) { gameView.events.push(GameEvent.hardDrop); });
        (_j = document.getElementById("touch-hold")) === null || _j === void 0 ? void 0 : _j.addEventListener("touchstart", function (_e) { gameView.events.push(GameEvent.holdBlock); });
    }
    console.log("Game loaded");
    // main
    gameView.run();
});
