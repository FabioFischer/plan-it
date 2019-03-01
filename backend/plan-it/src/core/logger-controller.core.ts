import { ClusterWorkerMessageType } from "./cluster-message";
const {Logger, transports} = require('winston');

export class LoggerController {

    private dateFormat: Function;
    private logDir: string;
    private actualFileDate: string;
    private consoleLogLevel: string;
    private fileLogLevel: string;
    private maxFileSize: number;
    private handleException: boolean;
    private logger;

    constructor(logDir:string, consoleLogLevel: string, fileLogLevel: string, maxFileSize: number, handleException: boolean) {
        this.setDateFormat(require('dateformat'));
        this.setLogDir(logDir);
        this.setConsoleLogLevel(consoleLogLevel);
        this.setFileLogLevel(fileLogLevel);
        this.setMaxFileSize(maxFileSize);
        this.setMaxHandleException(handleException)
        this.setupLogger(this.getLogDir(), this.getDate(), this.getConsoleLogLevel(), this.getFileLogLevel(), this.getMaxFileSize(), this.getHandleException());
    }

    public getDateFormat(): Function {
        return this.dateFormat;
    }

    public setDateFormat(dateFormat: Function){
        this.dateFormat = dateFormat;
    }

    public getLogDir(): string {
        return this.logDir;
    }

    public setLogDir(logDir: string){
        this.logDir = logDir;
        this.makeDir(logDir);
    }

    public getActualFileDate(): string {
        return this.actualFileDate;
    }

    public setActualFileDate(actualFileDate: string){
        this.actualFileDate = actualFileDate;
    }

    public getConsoleLogLevel(): string {
        return this.consoleLogLevel;
    }

    public setConsoleLogLevel(consoleLogLevel: string){
        this.consoleLogLevel = consoleLogLevel;
    }

    public getFileLogLevel(): string {
        return this.fileLogLevel;
    }

    public setFileLogLevel(fileLogLevel: string){
        this.fileLogLevel = fileLogLevel;
    }

    public getMaxFileSize(): number {
        return this.maxFileSize;
    }

    public setMaxFileSize(maxFileSize: number){
        this.maxFileSize = maxFileSize;
    }

    public getHandleException(): boolean {
        return this.handleException;
    }

    public setMaxHandleException(handleException: boolean){
        this.handleException = handleException;
    }

    public getLogger(){
        let actualDate = this.getDate();
        if (this.logger === null || this.getActualFileDate() === null || this.getActualFileDate() !== actualDate){
            this.setupLogger(this.getLogDir(), actualDate, this.getConsoleLogLevel(), this.getFileLogLevel(), this.getMaxFileSize(), this.getHandleException());
        }
        return this.logger;
    }

    public setLogger(logger){
        this.logger = logger;
    }

    private setupLogger(logDir: String, fileDate: string, consoleLogLevel: string, fileLogLevel: string, maxFileSize: number, handleException: boolean){
        this.setActualFileDate(fileDate);
        let fullLogFile = `${logDir}/${fileDate}-log.log`;
        this.setLogger(new Logger({
            transports: [
                new transports.Console({
                    timestamp: true,
                    colorize: true,
                    level: consoleLogLevel,
                    handleExceptions: handleException,
                    humanReadableUnhandledException: handleException
                }),
                new transports.File({
                    filename: fullLogFile,
                    timestamp: true,
                    level: fileLogLevel,
                    maxsize: maxFileSize,
                    handleExceptions: handleException,
                    humanReadableUnhandledException: handleException,
                    json: true
                })
            ]
        }));
        this.logger.info('New logger created:\n' + 
                        `   Console Log Level: ${consoleLogLevel}\n` +
                        `   File Log Level: ${fileLogLevel}\n` +
                        `   Max File Size: ${maxFileSize}\n` +
                        `   Handle Exception: ${handleException}\n` +
                        `   Full Log File: ${fullLogFile}`
                        );
    }

    private makeDir(logDir:string) {
        let mkdirp = require('mkdirp');
        mkdirp.sync(logDir);
    }

    private getDate(): string {
        return this.getDateFormat()(new Date(), 'yyyy-mm-dd');
    }

}

export class WorkerLoggerController {

    private logger;

    constructor() {
        this.setLogger(new WorkerLogger());
    }

    public getLogger(){
        return this.logger;
    }

    public setLogger(logger){
        this.logger = logger;
    }
}

export class WorkerLogger {
    public error(message: string, logFrom?:LogFrom){
        process.send({type: ClusterWorkerMessageType.LOG, logType: LogType.ERROR, message: message, logFrom: (logFrom ? logFrom : LogFrom.BACK)});
    }
    public warn(message: string, logFrom?:LogFrom){
        process.send({type: ClusterWorkerMessageType.LOG, logType: LogType.WARN, message: message, logFrom: (logFrom ? logFrom : LogFrom.BACK)});
    }
    public info(message: string, logFrom?:LogFrom){
        process.send({type: ClusterWorkerMessageType.LOG, logType: LogType.INFO, message: message, logFrom: (logFrom ? logFrom : LogFrom.BACK)});
    }
    public debug(message: string, logFrom?:LogFrom){
        process.send({type: ClusterWorkerMessageType.LOG, logType: LogType.DEBUG, message: message, logFrom: (logFrom ? logFrom : LogFrom.BACK)});
    }
    public verbose(message: string, logFrom?:LogFrom){
        process.send({type: ClusterWorkerMessageType.LOG, logType: LogType.VERBOSE, message: message, logFrom: (logFrom ? logFrom : LogFrom.BACK)});
    }
    public silly(message: string, logFrom?:LogFrom){
        process.send({type: ClusterWorkerMessageType.LOG, logType: LogType.SILLY, message: message, logFrom: (logFrom ? logFrom : LogFrom.BACK)});
    }
}

export enum LogType {
    ERROR,
    WARN,
    INFO,
    DEBUG,
    VERBOSE,
    SILLY
}

export enum LogFrom {
    BACK, 
    FRONT
}

export class StaticLogger {

    public static _loggerControllerBack;
    public static _loggerControllerFront;

    static getLoggerController(logFrom: LogFrom = LogFrom.BACK){
        switch(logFrom){
            case LogFrom.BACK:
                return StaticLogger.loggerControllerBack;
            case LogFrom.FRONT:
                return StaticLogger.loggerControllerFront;
        }
    }

    static get loggerControllerBack(){
        if (!StaticLogger._loggerControllerBack) {
            let cluster = require('cluster');
            if (cluster.isMaster) {
                StaticLogger._loggerControllerBack = new LoggerController (
                    process.env.AL_DIR || 'logs/back',
                    process.env.AL_CONSOLE_LOGLEVEL || 'silly',
                    process.env.AL_FILE_LOGLEVEL || 'info',
                    +process.env.AL_MAX_FILE_SIZE || 104857600,
                    true
                );
            } else {
                StaticLogger._loggerControllerBack = new WorkerLoggerController();
            }
            
        }
        return StaticLogger._loggerControllerBack;

    }

    static get loggerControllerFront(){
        if (!StaticLogger._loggerControllerFront) {
            let cluster = require('cluster');
            if (cluster.isMaster) {
                StaticLogger._loggerControllerFront = new LoggerController(
                    process.env.FL_DIR || 'logs/front',
                    process.env.FL_CONSOLE_LOGLEVEL || 'silly',
                    process.env.FL_FILE_LOGLEVEL || 'info',
                    +process.env.FL_MAX_FILE_SIZE || 104857600,
                    false
                );
            } else {
                StaticLogger._loggerControllerFront = new WorkerLoggerController();
            }
        }
        return StaticLogger._loggerControllerFront;
    }
    
}