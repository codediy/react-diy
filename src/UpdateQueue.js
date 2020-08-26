export class Update {
    constructor(payload) {
        this.payload = payload
    }
}

/*更新链表*/
export class UpdateQueue {
    constructor() {
        this.firstUpdate = null;
        this.lastUpdate = null;
    }

    enqueueUpdate(update) {
        if (this.lastUpdate === null) {
            this.firstUpdate = update;
            this.lastUpdate = update;
        } else {
            this.lastUpdate.nextUpdate = update;
            this.lastUpdate = update;
        }
        console.log("Queue", update, this.firstUpdate, this.lastUpdate);
    }

    forceUpdate(state) {
        let currentUpdate = this.firstUpdate;
        while (currentUpdate) {
            let nextState = typeof  currentUpdate.payload === "function"
                ? currentUpdate.payload(state)
                : currentUpdate;
            state = {...state, ...nextState};

            currentUpdate = currentUpdate.nextUpdate;
        }
        this.firstUpdate = null;
        this.lastUpdate = null;
        return state;
    }
}