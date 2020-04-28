class BlockGenerator {
    bag: BlockName[] = []
    getNextBlock() {
        if (this.bag.length < 3) {
            let newBag = blockNames.slice() // copys the array
            shuffleArray(newBag)
            this.bag = this.bag.concat(newBag)
        }
        let ret = this.bag.shift() as BlockName
        let next1 = this.bag[0], next2 = this.bag[1];
        (document.getElementById("next1") as HTMLImageElement).src = "assets/" + next1 + "-shape.png";
        (document.getElementById("next2") as HTMLImageElement).src = "assets/" + next2 + "-shape.png"
        return ret
    }
}
