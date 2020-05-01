class BlockGenerator {
    bag: BlockName[] = []
    getNextBlock(): BlockName {
        let elems = document.getElementsByClassName("next-blocks-img") // length should be 6
        // 1 for next block, others for next view
        if (this.bag.length < elems.length + 1) {
            let newBag = blockNames.slice() // copys the array
            shuffleArray(newBag)
            this.bag = this.bag.concat(newBag)
        }
        let ret = this.bag.shift() as BlockName

        for (let i = 0; i < elems.length; i++) {
            (elems[i] as HTMLImageElement).src = `assets/${this.bag[i]}-shape.png`
        }
        return ret
    }
}
