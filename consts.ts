// Compile using TypeScript 3.8.3

type BlockName = "i" | "j" | "l" | "o" | "s" | "t" | "z"
type Shape = string[]
type Rotation = "0" | "1" | "2" | "3"
type BlockShapes = {
    [key in Rotation]: Shape
}
type BlockMap = { [key in BlockName]: BlockShapes }

const blockNames: BlockName[] = ["i", "j", "l", "o", "s", "t", "z"]
const blockShapes: BlockMap = {
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
}
