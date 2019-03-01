import { ClusterLock } from "./cluster-lock-manager";

const uuidv4 = require('uuid/v4');

export class ClusterMasterMessage {
    public assertion: boolean;
    public lock: ClusterLock;

    constructor(assertion: boolean, lock: ClusterLock) {
        this.setAssertion(assertion);
        this.setLock(lock);
    }

    public getAssertion(): boolean {
        return this.assertion;
    }

    public setAssertion(assertion: boolean): void {
        this.assertion = assertion;
    }

    public getLock(): ClusterLock {
        return this.lock;
    }

    public setLock(alocation: ClusterLock): void {
        this.lock = alocation;
    }
}

export enum ClusterWorkerMessageType {
    REQUEST_LOCK,
    CONCLUSION,
    TIMED_OUT,
    LOG
}

export enum ClusterMasterMessageType {
    START_WORKER_APP
}


export class ClusterWorkerMessage {
    public type: ClusterWorkerMessageType;
    public context: string;
    public uuid: string;

    constructor(type: ClusterWorkerMessageType, context: string, uuid?: string) {
        this.setType(type);
        this.setContext(context);

        if (uuid) {
            this.signMessage(uuid);
        } else {
            this.signMessage(uuidv4());
        }
    }

    public getType(): ClusterWorkerMessageType {
        return this.type;
    }

    public setType(type: ClusterWorkerMessageType): void {
        this.type = type;
    }

    public getContext(): string {
        return this.context;
    }

    public setContext(context: string): void {
        this.context = context;
    }

    public getUuid(): string {
        return this.uuid;
    }

    public signMessage(uuid: string) {
        this.uuid = uuid
    }
}
