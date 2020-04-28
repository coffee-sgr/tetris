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
function shuffleArray(arr: Array<any>) {
    for (let i = 0; i < arr.length; i++) {
        let index = i + Math.floor(Math.random() * (arr.length - i - 1)) // pick one from other elements
        let tmp = arr[i]
        arr[i] = arr[index]
        arr[index] = tmp
    }
}
