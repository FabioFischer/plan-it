import {Router, Request, Response, NextFunction} from 'express';
import * as jwt from 'jsonwebtoken';

import { LoggerManager, StaticLogger, LogFrom } from '../core/logger-manager';
import { GenericDBRequester } from '../database/dbconnector/generic.dbrequester';
import { User } from '../model/user.model';

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

export abstract class GenericRest {

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
    public static async authenticator(req: Request, res: Response, next: any) {
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
            next();
        } catch(e) {
            StaticLogger.getLoggerController().getLogger().error((e && e.exception ? e.exception.toString() : (e ? e.toString() : e)) + (e && e.stack ? e.stack.toString() : ''));
            this.generateResponse(res, 401, getResultCode("UNMAPPED_ERROR"));
            return;
        }
    }

    /** */
    public static async requisitionLogger(req: Request, res: Response, next: any) {
        /*
        console.log(req)
        console.log('---------')
        console.log(res)
        */
        return;
        try {

        } catch(e) {
            StaticLogger.getLoggerController().getLogger().error((e && e.exception ? e.exception.toString() : (e ? e.toString() : e)) + (e && e.stack ? e.stack.toString() : ''));
            return;
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

    public static async encapsulatedRequest(req: Request, res: Response, next: NextFunction, func: Function) {
        try {
            let data = await func();
            if (data) {
                this.generateResponse(res, 200, getResultCode("SUCCESSFUL"), data);
            } else {
                this.generateResponse(res, 204, getResultCode("SUCCESSFUL"));
            }
        } catch(e) {
            console.log(e);
            StaticLogger.getLoggerController().getLogger().log('error', JSON.stringify(e));
            this.generateResponse(res, e.status || 500 , e.errorCode);
        } finally {
            if (next) next();
        }
    }

    public static generateResponse(res: Response, status: number, resultCode: string, data?) {
        let resData = {
            result_code: resultCode || getResultCode("UNMAPPED_ERROR")
        };
        if (data) {
            resData['data'] = data;
        }
        if (status) {
            res.status(status).json(resData);
        } else {
            res.json(resData);
        }
    }

    public static appendResponseHeader(res: Response, key: string, value: any) {
        res.set(key, value);
    }

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