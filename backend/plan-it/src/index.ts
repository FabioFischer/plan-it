
import { ClusterWorkerMessageType, ClusterMasterMessageType } from './core/cluster-message';
import { LogType, StaticLogger } from './core/logger-controller.core';

import * as debug from 'debug';
import * as http from 'http';

import App from './App';

require('dotenv').config({ path: process.cwd() + '/env/.env.default' });
const numCPUs = require('os').cpus().length;
const cluster = require('cluster');

if (cluster.isMaster) {
    
    StaticLogger.getLoggerController().getLogger().info(`Starting Server - Master ${process.pid} is running`);
    
    //setup application logger
    process.on('unhandledRejection', (reason, p) =>  {
        console.log(reason)
        //throw Error(reason);
        process.exit(1);
    });

    // handle worker -> MasterMessage
    function workerMessageSwitch(msg) {
        if (msg) {
            switch (msg.type) {
                case ClusterWorkerMessageType.LOG: 
                    let logger = StaticLogger.getLoggerController(msg.logFrom);
                    switch (msg.logType) {
                        case LogType.ERROR:
                            logger.getLogger().error(msg.message);
                            break;
                        case LogType.WARN:
                            logger.getLogger().warn(msg.message);
                            break;
                        case LogType.INFO:
                            logger.getLogger().info(msg.message);
                            break;
                        case LogType.DEBUG:
                            logger.getLogger().debug(msg.message);
                            break;
                        case LogType.VERBOSE:
                            logger.getLogger().verbose(msg.message);
                            break;
                        case LogType.SILLY:
                            logger.getLogger().silly(msg.message);
                            break;
                    }
                    break;
            }
        }
    }
    let workers = new Map<number, any>();    

    for (let i = 0; i < numCPUs; i++) {
        var worker = cluster.fork();
        workers.set(worker.process.pid, worker);
        // Receive messages from this worker and handle them in the master process.
        worker.on('message', workerMessageSwitch);
        worker.send({type: ClusterMasterMessageType.START_WORKER_APP});
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died`);
    });
    
} else {
    StaticLogger.getLoggerController().getLogger().info(`Starting Server - Worker ${process.pid} is running`);

    //setup application logger
    process.on('unhandledRejection', (reason, p) =>  {
        console.log(reason);
        StaticLogger.getLoggerController().getLogger().error(reason);
        throw Error(reason);
    });

    let port;
    let server;
   
    function onError(error: NodeJS.ErrnoException): void {
        if (error.syscall !== 'listen') {
            throw error;
        }
        let bind = (typeof port === 'string') ? 'Pipe ' + port : 'Port ' + port;

        switch(error.code) {
            case 'EACCES':
                console.error(`${bind} requires elevated privileges`);
                process.exit(1);
                break;
            case 'EADDRINUSE':
                console.error(`${bind} is already in use`);
                process.exit(1);
                break;
            default:
                throw error;
        }
    }

    function onListeningApp(): void {
        let addr = server.address();
        let bind = (typeof addr === 'string') ? `pipe ${addr}` : `port ${addr.port}`;
        StaticLogger.getLoggerController().getLogger().info(`Cluster ${process.pid} - Listening on ${bind} - App`);
    }

    function normalizePort(val: number|string): number|string|boolean {
        let port: number = (typeof val === 'string') ? parseInt(val, 10) : val;
        if (isNaN(port)) {
            return val;
        } else if (port >= 0) {
            return port;
        } else {
            return false;
        }
    }

    // setup cluster worker listener
    process.on('message', function(msg) {
        if (msg) {
            switch (msg.type) {
                case ClusterMasterMessageType.START_WORKER_APP:
                    //setup server
                    if (process.env.DEV_ENV == 'true') {
                        debug('ts-express:server');
                    }
                    port = normalizePort(3005);
                    App.set('port', port);
                    server = http.createServer(App);
                    server.listen(port);
                    server.on('error', onError);
                    server.on('listening', onListeningApp);
                    break;
            }
        }
    });
}
