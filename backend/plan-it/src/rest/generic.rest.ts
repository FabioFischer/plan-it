import {Router, Request, Response} from 'express';
import * as jwt from 'jsonwebtoken';

import { Logger, StaticLogger, LogFrom } from '../core/logger';
import { GenericDBRequester } from '../database/dbconnector/generic.dbrequester';
import { User } from '../model/user.model';

export class GenericRestResultCodes {
    public static RESULT_CODE_SUCCESS: string = '00';
    public static RESULT_CODE_GENERIC_ERROR: string = '10'
    public static RESULT_CODE_LOGIN_UNAUTHENTICATED: string = '10-1000';
    public static RESULT_CODE_LOGIN_INVALID_CREDENTIALS: string = '10-1001';
    public static RESULT_CODE_MODEL_ERROR: string = '11';
    public static RESULT_CODE_DB_ERROR: string = '12';
    public static RESULT_CODE_DB_LESS_EQUAL_ZERO_ROW: string = '12-1000';
    public static RESULT_CODE_DB_MORE_THAN_ONE_ROW: string = '12-1001';
    public static RESULT_CODE_DB_OBJECT_ALREADY_EXISTS: string = '12-1002';
    public static RESULT_CODE_DB_SERVICE_ORDER_PENDING_DEPENDENCIES: string = '12-1003';
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
            const token = req.get(process.env.TOKEN_HEADER_DEFINITION);
            const isUnauthenticatedResponse = () => {
                this.generateResponse(res, GenericRestResultCodes.RESULT_CODE_LOGIN_UNAUTHENTICATED, null);
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
        } catch(e) {
            StaticLogger.getLoggerController().getLogger().error((e && e.exception ? e.exception.toString() : (e ? e.toString() : e)) + (e && e.stack ? e.stack.toString() : ''));
            this.generateResponse(res, e.errorCode);
            return;
        }
    }

    /**
     * 
     * @param req 
     */
    public static async getAuthenticatedEmployee(req: Request): Promise<User> {
        return req[`${process.env.AUTHENTICATED_USER_REQUEST_DEFINITION}`];
    }
    
    /**
     * 
     * @param req 
     * @param data 
     */
    public static async setAuthenticatedEmployee(req: Request, data: any): Promise<void> {
        req[`${process.env.AUTHENTICATED_USER_REQUEST_DEFINITION}`] = data;
    }

    public static async encapsulatedRequest(req: Request, res: Response, func: Function) {
        try {
            let resultCode;
            try {
                /** 
                 * Execute encapsulated function 
                 */
                let data = await func();
                resultCode = (data ? data.resultCode || GenericRestResultCodes.RESULT_CODE_SUCCESS : GenericRestResultCodes.RESULT_CODE_SUCCESS);
                this.generateResponse(
                    res, 
                    resultCode, 
                    (data ? data.data || data : null)
                );
            } catch(e) {
                resultCode = !resultCode ? e.errorCode : resultCode;
                StaticLogger.getLoggerController().getLogger().error((e && e.exception ? e.exception.toString() : (e ? e.toString() : e)) + (e && e.stack ? e.stack.toString() : (e ? e.toString() : e)));
                this.generateResponse(res, e.errorCode);
            }
        } catch(e) {
            StaticLogger.getLoggerController().getLogger().error((e && e.exception ? e.exception.toString() : (e ? e.toString() : e)) + (e && e.stack ? e.stack.toString() : (e ? e.toString() : e)));
            this.generateResponse(res, e.errorCode);
        }
    }

    public static generateResponse(res: Response, resultCode: string, data?) {
        if (data){
            res.json({
                resultCode: resultCode || GenericRestResultCodes.RESULT_CODE_GENERIC_ERROR,
                data: data
            });
        } else {
            res.json({
                resultCode: resultCode || GenericRestResultCodes.RESULT_CODE_GENERIC_ERROR
            });
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
    public static loggerManager: Logger;
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