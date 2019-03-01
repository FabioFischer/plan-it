import { ClusterWorkerMessage } from "./cluster-message";

export class ClusterLockManager {
    public locks: Array<{context: string, lock: ClusterLock}>;

    constructor() {
        this.locks = new Array<{context: string, lock: ClusterLock}>();
    }

    public addLock(workerMessage: ClusterWorkerMessage, clusterPid: number): ClusterLock {
        if (!(this.locks.findIndex(e => e.context == workerMessage.context) > -1)) {
            let lock = new ClusterLock(clusterPid, workerMessage.uuid);
            this.locks.push({
                context: workerMessage.context,
                lock: lock
            });

            return lock;
        }
        return null;
    }

    public removeLock(uuid: string): void {
        this.locks = this.locks.filter(e => {
            e.lock.getUuid() === uuid
        });
    }

    public isContextAvailable(context: string): boolean {
        return this.locks.findIndex(e => e.context == context) <= -1;
    }

    public getNextLock(): {context: string, lock: ClusterLock} {
        return this.locks.shift();
    }
}

export class ClusterLock {
    public clusterPid: number;
    public uuid: string;
    
    constructor(clusterPid: number, uuid: string) {
        this.setClusterPid(clusterPid);
        this.setUuid(uuid);
    }

    public getClusterPid(): number {
        return this.clusterPid;
    }

    public setClusterPid(clusterPid: number): void {
        this.clusterPid = clusterPid;
    }

    public getUuid(): string {
        return this.uuid;
    }

    public setUuid(uuid: string): void {
        this.uuid = uuid;
    }
}