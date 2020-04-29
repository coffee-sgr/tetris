class GameSettings {
    static fps = 30
    // Number of rows and columns
    static rowNum = 20
    static colNum = 10
    // Time interval between block drop in frames
    static dropSpeed = 30
    // How long a block can stay active after touching the bottom in frames
    static hardDropLife = 30
    // How long the prompt text (e.g. tetris) can stay active
    static promptTextLife = 45
    static isInBound(x: number, y: number): boolean {
        return x >= 0 && x < GameSettings.rowNum && y >= 0 && y < GameSettings.colNum
    }
}
