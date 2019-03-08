import {Router, Request, Response, NextFunction} from 'express';
import * as jwt from 'jsonwebtoken';

import { LoggerManager, StaticLogger, LogFrom } from '../core/logger-manager';
import { GenericDBRequester } from '../database/dbconnector/generic.dbrequester';
import { User } from '../model/user.model';
import { RequisitionLog, RequisitionLogger } from '../core/requisition-logger.core';

const restResultCodes = require('../../assets/result_code.json');

/**
 * Search on the application result codes for the given identifier. 
 * If no result code is found to given id, the default code for a unmapped error is <10>.
 * @param id result code identifier
 */
export const getResultCode = (id: string): string => {
    let transaction = restResultCodes.find(resultCodes => resultCodes.id == id);
    if (transaction && transaction.code) {
        return transaction.code;
    } return '10';
}

/**
 * 
 * @param method 
 */
export const shouldLogRequisition = (method: string): boolean => {
    return process.env.LOG_GEN_ALL === 'true' && (method != 'GET' || process.env.LOG_GEN_GET === 'true');
}

export abstract class GenericRest {

    public static REQUISITION_LOGGER: RequisitionLogger = new RequisitionLogger();

    public router: Router;
    
    constructor() {
        this.router = Router();
        this.init();
    }

    public abstract init();

    /**
     * 
     * @param req 
     * @param res 
     * @param next 
     */
    public static async startRequisition(req: Request, res: Response, next: any) {
        try {
            if (shouldLogRequisition(req.method)) {
                let requisition = new RequisitionLog();
                requisition.setBeginDate(new Date());
                res.locals.requisition_log = requisition;
            }
            next();
        } catch(e) {
            StaticLogger.getLoggerController().getLogger().log('error', e);
            this.generateResponse(res, getResultCode("UNMAPPED_ERROR"));
            return;
        }
    }

    /**
     * 
     * @param req 
     * @param res 
     * @param next 
     */
    public static async authenticateRequisition(req: Request, res: Response, next: any) {
        let requisitionLog: RequisitionLog = res.locals.requisition_log;
        try {
            /*
            const token = req.get(process.env.TOKEN_HEADER_DEFINITION);
            const isUnauthenticatedResponse = () => {
                this.generateResponse(res, getResultCode("UNATHENTICATED"), null);
            }
            if (!token) {
                isUnauthenticatedResponse();
            } else {    
                jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
                    if (err) {
                        isUnauthenticatedResponse();
                    } else {
                        this.setAuthenticatedEmployee(req, decoded.data)
                        next();
                    }
                });
            }
            return;
            */
            //requisitionLog.setUserId(1);
            next();
        } catch(e) {
            StaticLogger.getLoggerController().getLogger().log('error', e);
            this.generateResponse(res, getResultCode("UNMAPPED_ERROR"));
            return;
        }
    }

    /**
     * 
     * @param req 
     * @param res 
     * @param next 
     */
    public static async requisitionLogger(req: Request, res: Response, next: any) {
        let requisitionLog: RequisitionLog = res.locals.requisition_log;
        try {
            if (res.locals.requisition_log && shouldLogRequisition(req.method)) {
                requisitionLog.setMethod(req.method);
                requisitionLog.setEndPoint(req.originalUrl);
                requisitionLog.setParams(JSON.stringify({
                    query: req.query,
                    params: req.params
                }));
                requisitionLog.setReqBody(JSON.stringify({
                    body: req.body
                }));
                requisitionLog.setEndDate(new Date());
                await this.REQUISITION_LOGGER.log(requisitionLog);
            }
            next();
        } catch(e) {
            console.log(e)
            //StaticLogger.getLoggerController().getLogger().log('error', e);
            next();
        }
    }

    /**
     * 
     * @param req 
     */
    public static async getAccessToken(req: Request): Promise<User> {
        return req[`${process.env.ACCESS_TOKEN_DEFINITION}`];
    }
    
    /**
     * 
     * @param req 
     * @param data 
     */
    public static async setAccessToken(req: Request, data: any): Promise<void> {
        req[`${process.env.ACCESS_TOKEN_DEFINITION}`] = data;
    }

    /**
     * 
     * @param req 
     * @param res 
     * @param next 
     * @param func 
     */
    public static async encapsulatedRequest(req: Request, res: Response, next: NextFunction, func: Function) {
        let requisitionLog: RequisitionLog = res.locals.requisition_log;
        let resultCode = getResultCode("SUCCESSFUL");
        try {
            let data = await func();
            requisitionLog.setResBody(JSON.stringify(data));
            this.generateResponse(res, resultCode, data);
        } catch(e) {
            console.log(e);
            resultCode = e.errorCode || getResultCode("UNMAPPED_ERROR");
            StaticLogger.getLoggerController().getLogger().log('error', e);
            this.generateResponse(res, e.status || 500 ,resultCode);
        } finally {
            requisitionLog.setResStatus(res.statusCode);
            requisitionLog.setResCode(resultCode);
            if (next) next();
        }
    }

    /**
     * 
     * @param res 
     * @param resultCode 
     * @param data 
     */
    public static generateResponse(res: Response, resultCode: string, data?) {
        let resData = {
            result_code: resultCode || getResultCode("UNMAPPED_ERROR")
        };
        if (data) {
            this.appendIntoData(resData, data, 'data');
        }
        res.json(resData);
    }

    /**
     * 
     * @param res 
     * @param key 
     * @param value 
     */
    public static appendResponseHeader(res: Response, key: string, value: any) {
        res.set(key, value);
    }

    /**
     * 
     * @param data 
     * @param other 
     * @param as 
     */
    public static appendIntoData(data: any, other: any, as: string): any {
        if (data) {
            data[as] = other;
        }
        return data;
    }
}

export abstract class GenericDBRest extends GenericRest {

    public static dbRequester: GenericDBRequester;

    constructor(sqlProviderFile: string){
        super();
        this.configureDBRequester(sqlProviderFile);
    }

    public async configureDBRequester(sqlProviderFile: string) {
        await this.setDBRequester(await new GenericDBRequester());
        let dbRequester: GenericDBRequester = await this.getDBRequester();
        await dbRequester.loadDatabaseDependencies(sqlProviderFile);
        await this.setupSQLProvider(dbRequester.namespace); 
    }

    public abstract getDBRequester();

    public abstract setDBRequester(dbRequester);

    public abstract setupSQLProvider(namespace);

    public setSQLProvider(sqlProvider) {
        this.getDBRequester().sqlProvider = sqlProvider;
    }
    
    public static validateRowCount(condition: boolean, errorCode: string) {
        try {
            if (condition)
            throw new Error('Row count error.');
        } catch(e) {
            throw {exception: e, errorCode: errorCode};
        }
    }
}

export abstract class GenericFileRest extends GenericRest {
    public static loggerManager: LoggerManager;
    public static loggerType: LogFrom;

    constructor(loggerType: LogFrom) {
        super();
        this.configureLogger(loggerType);
    }

    public async configureLogger(loggerType: LogFrom) {
        await this.setLoggerManager(StaticLogger.getLoggerController(loggerType));
        await this.getLoggerManager();
        await this.setLoggerType(loggerType);
    }

    public abstract getLoggerManager();

    public abstract setLoggerManager(loggerManager);

    public abstract setLoggerType(loggerType: LogFrom);

}