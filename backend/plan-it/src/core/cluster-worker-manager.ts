import { ClusterMasterMessage, ClusterWorkerMessage, ClusterWorkerMessageType } from "./cluster-message";
import { ClusterLock } from "./cluster-lock-manager";

export class ClusterWorkerManager {

    /**
     * All the local locked contexts will be controlled on this map. Even thought he is only used for context comparison right now, 
     * it can be a good way to manage thread processing in the future
     */
    public static lockedFunctions: Map<string, ClusterLock> = new Map<string, ClusterLock>();
    
    /**
     * 
     * @param masterMessage message sended by master that will be stored on local lock array 
     */
    public static async addLockedFunction(masterMessage: ClusterMasterMessage): Promise<void> {
        if (!ClusterWorkerManager.lockedFunctions.has(masterMessage.lock.uuid)) {
            ClusterWorkerManager.lockedFunctions.set(masterMessage.lock.uuid, masterMessage.lock);
        }
    }

    /**
     * 
     * @param uuid unique id of locked context 
     */
    public static async removeLockedFunction(uuid: string): Promise<void> {
        if (ClusterWorkerManager.lockedFunctions.has(uuid)) {
            ClusterWorkerManager.lockedFunctions.delete(uuid);
        }
    }

    /**
     * 
     * @param uuid unique id of locked context 
     */
    public static async getLockedFunction(uuid: string): Promise<ClusterLock> {
        return ClusterWorkerManager.lockedFunctions.get(uuid);
    }

    /**
     * 
     * @param uuid unique id of locked context 
     */
    public static async hasLockedFunction(uuid: string): Promise<boolean> {
        return await ClusterWorkerManager.lockedFunctions.has(uuid);
    }

    /**
     * 
     * @param type type of the deallocation, the cluster master will handle the deallocation differentelly based on this field 
     * @param context context used by cluster master to lock. No paralalel locks can be create for the same context
     * @param uuid unique id of locked context 
     */
    public static async deallocateFunction(type: ClusterWorkerMessageType, context: string, uuid: string): Promise<void> {
        await process.send(new ClusterWorkerMessage(type, context, uuid))
        await ClusterWorkerManager.removeLockedFunction(uuid);
    }

    /**
     * 
     * @param context context used by cluster master to lock. No paralalel locks can be create for the same context
     * @param fn function to be called when cluster master successfully locked the cluster worker context
     * @param timedOut function to be called when cluster master didn't respond until timeout threshold
     */
    public static async syncFunction(context: string, fn: () => any, timeout?: () => any): Promise<void> {
        let message = new ClusterWorkerMessage(
            ClusterWorkerMessageType.REQUEST_LOCK, context
        );
        // Send message to cluster master.
        await process.send(message)

        await ClusterWorkerManager.waitAvailability(
            message.getUuid(),
            // cluster master locked function successfully
            async () => {
                await fn();
                await ClusterWorkerManager.deallocateFunction(
                    ClusterWorkerMessageType.CONCLUSION, context, message.getUuid()
                );
            },
            // cluster master didn't respond
            async () => {
                if (timeout) await timeout();
                await ClusterWorkerManager.deallocateFunction(
                    ClusterWorkerMessageType.TIMED_OUT, context, message.getUuid()
                );
            }
        );
    }

    /**
     * 
     * @param uuid unique id of locked context
     * @param callback function to be called when cluster master successfully locked the cluster worker context
     * @param timedOut function to be called when cluster master didn't respond until timeout threshold
     */
    public static async waitAvailability(uuid: string, callback?: () => any, timedOut?: () => any): Promise<void> {
        if (await ClusterWorkerManager.wait(uuid)) {
            if (callback) await callback();
        } else {
            if (timedOut) await timedOut();
        }
    }

    /**
     * 
     * @param uuid unique id of locked function
     * @param result recursion motion
     * @param index current iteration time based
     */
    public static async wait(uuid: string, result?: boolean, index?: number): Promise<boolean> {
        if (!result) {
            if ((index || 0) < (process.env.CLUSTER_LOCK_TIME_THRESHOLD || 100)) {
                /**
                 * Sleep this thread allowing the cluster master to reach out to the worker cluster
                 * The value is based on his respective environtment variable, the default value is 100ms
                 * We need to be careful with this value because the refresh value will be the lowest requisition cost 
                 * it cannot be a high number althought a really small value can overuse the processor
                 */
                await new Promise(r => setTimeout(r, (process.env.CLUSTER_LOCK_TIME_REFRESH || 100)));
                /**
                 * Recursivelly call itself checking if the cluster master responded to this thread 
                 * allowing, or not, the execution of the context function 
                 */
                return await ClusterWorkerManager.wait(
                    uuid, await ClusterWorkerManager.hasLockedFunction(uuid), (index || 0)+1
                ); 
            } else return false;
        } else return true;
    }
}