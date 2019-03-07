import { Request, Response, NextFunction } from 'express';
import { GenericDBRest, getResultCode } from './generic.rest';

import { AuthenticationHelper } from '../core/authentication-manager';
import { Authentication } from '../model/authentication.model';
import { User } from '../model/user.model';

export class UserRouter extends GenericDBRest {
 
    constructor() {
        super('user-sql-provider');
    }

    public init() {
        this.router.get('/', this.authenticationHandler, this.getAll, this.postRequisitionHandler);
        this.router.get('/:id', this.authenticationHandler, this.get, this.postRequisitionHandler);
        this.router.post('/', this.authenticationHandler, this.post, this.postRequisitionHandler);
        this.router.post('/returning_object', this.authenticationHandler, this.postReturningObject, this.postRequisitionHandler);
        this.router.put('/', this.authenticationHandler, this.put, this.postRequisitionHandler);
        this.router.delete('/:id', this.authenticationHandler, this.delete, this.postRequisitionHandler);
    }

    public async authenticationHandler(req: Request, res: Response, next: NextFunction) {
        return await UserRouter.authenticator(req, res, next);
    }

    public async postRequisitionHandler(req: Request, res: Response, next: NextFunction) {
        return await UserRouter.requisitionLogger(req, res, next);
    }

    public async setupSQLProvider(namespace){       
        this.setSQLProvider(new namespace.DefaultUserSQLProvider());
    }

    public getDBRequester() {
        return UserRouter.dbRequester;
    }

    public setDBRequester(dbRequester: any) {
        UserRouter.dbRequester = dbRequester;
    }

    public static getSQLProvider() {
        return UserRouter.dbRequester.sqlProvider;
    }

    public static getDBConnector() {
        return UserRouter.dbRequester.dbConnector;
    }

    public static async mergeDependencies(data): Promise<any> {
        let model = new User();
        try {
            model.clone(data);
        } catch (e) {
            throw {exception: e, errorCode: getResultCode('MODEL_ERROR')};
        }
        return {id: 3, descrip: 'TESTE'};
    }

    public async getAll(req: Request, res: Response, next: NextFunction) {
        // Verify if there is any optional parameters on req
        if (Object.keys(req.query).length > 0) {
            await UserRouter.encapsulatedRequest(req, res, next, async () => {
                let model: User;
                let dbRes;
                let data = [];

                // parse requisition query to a object
                try {
                    model = new User();
                    await model.clone(req.query);
                } catch(e) {
                    throw {exception: e, errorCode: getResultCode('MODEL_ERROR')};
                }         
                // returns data from table based on optional parameters
                try {
                    dbRes = await UserRouter.getDBConnector().runSQL(UserRouter.getSQLProvider().getCompost(model), 
                    UserRouter.getDBConnector().returnAllRows);
                } catch(e) {
                    throw {exception: e, errorCode: UserRouter.getDBConnector().getDBErrorCode(e)};
                }
                // Merge all dependencies of object into returning data
                if (dbRes instanceof Array) {
                    for (let obj of dbRes) {
                        let model = await UserRouter.mergeDependencies(obj);
                        data.push(model);
                    }
                } else {
                    data = await UserRouter.mergeDependencies(dbRes);
                }
                return data;
            });
        } else {
            await UserRouter.encapsulatedRequest(req, res, next, async () => {
                let dbRes;
                let data = [];
                // returns all the data from table
                try {
                    dbRes = await UserRouter.getDBConnector().runSQL(UserRouter.getSQLProvider().getAll(), 
                    UserRouter.getDBConnector().returnAllRows);
                } catch(e) {
                    throw {exception: e, errorCode: UserRouter.getDBConnector().getDBErrorCode(e)};
                }
                // Merge all dependencies of object into returning data
                if (dbRes instanceof Array) {
                    for (let obj of dbRes) {
                        let model = await UserRouter.mergeDependencies(obj);
                        data.push(model);
                    }
                } else {
                    data = await UserRouter.mergeDependencies(dbRes);
                }
                return data;
            });
        }
    }

    public async get(req: Request, res: Response, next: NextFunction) {      
        await UserRouter.encapsulatedRequest(req, res, next, async () => {
            let dbRes;
            let model: User;
            
            //get object
            try {
                model = new User();
                model.setId(req.params.id);
            } catch(e) {
                throw {exception: e, errorCode: getResultCode('MODEL_ERROR')};
            }

            //query
            try {
                dbRes = await UserRouter.getDBConnector().runSQL(UserRouter.getSQLProvider().get(model), 
                UserRouter.getDBConnector().returnFirstRow);
            } catch(e) {
                throw {exception: e, errorCode: UserRouter.getDBConnector().getDBErrorCode(e)};
            }
            // Merge all dependencies of object into returning data
            return await UserRouter.mergeDependencies(dbRes);
        });     
    }

    public async post(req: Request, res: Response, next: NextFunction) {
        await UserRouter.encapsulatedRequest(req, res, next, async () => {
            let model: User;
            let rowCount: number;
            let inserted = [];
            let reqBody = req.body.data;
            //get object
            try {
                model = new User();
                model.clone(reqBody);
            } catch(e) {
                throw {exception: e, errorCode: getResultCode('MODEL_ERROR')};
            }
            //validate object
            try {
                model.validPostData();
            } catch(e) {
                throw {exception: e, errorCode: getResultCode('MODEL_EXCEPTION')};
            }
            // validate UK's
            let validationModels = [];

            let valModel01 = new User();
            valModel01.setEmail(model.getEmail());

            validationModels.push(valModel01);

            for(let model of validationModels) {
                try {
                    rowCount = await UserRouter.getDBConnector().runSQL(UserRouter.getSQLProvider().getCompost(model), 
                    UserRouter.getDBConnector().returnRowCount);
                    rowCount = +rowCount;
                } catch(e) {
                    throw {exception: e, errorCode: UserRouter.getDBConnector().getDBErrorCode(e)};
                }
                //validate return - rowCount > 0
                UserRouter.validateRowCount(rowCount > 0, getResultCode('DB_OBJECT_VIOLATION'));
            }

            //query
            try {
                inserted = await UserRouter.getDBConnector().runSQL(UserRouter.getSQLProvider().post(model), 
                UserRouter.getDBConnector().returnAllRows);
            } catch(e) {
                throw {exception: e, errorCode: UserRouter.getDBConnector().getDBErrorCode(e)};
            }
            UserRouter.validateRowCount(inserted.length > 1, getResultCode('DB_MULTIPLE_ROWS_AFFECTED'));
            UserRouter.validateRowCount(inserted.length <= 0, getResultCode('DB_NO_ROWS_AFFECTED'));

            let insertedId = inserted[0].id;
            try {
                if (!reqBody.password || reqBody.password == '') throw 'Requisition body must contain the <password> property'
            } catch(e) {
                throw {exception: e, errorCode: getResultCode('MODEL_EXCEPTION')};
            }

            /** Insert authentication data */
            let authenticationModel = new Authentication();
            try {
                let hashedPassword = AuthenticationHelper.segurifyCredential(reqBody.password);
                authenticationModel.clone({
                    hash: hashedPassword.hash,
                    salt: hashedPassword.salt,
                    user_id: insertedId
                });
            } catch(e) {
                throw {exception: e, errorCode: getResultCode('MODEL_ERROR')};
            }
            try {
                rowCount = await UserRouter.getDBConnector().runSQL(UserRouter.getSQLProvider().postUserAuthentication(authenticationModel), 
                UserRouter.getDBConnector().returnRowCount);
                rowCount = +rowCount;
            } catch(e) {
                throw {exception: e, errorCode: UserRouter.getDBConnector().getDBErrorCode(e)};
            }
            UserRouter.validateRowCount(rowCount > 1, getResultCode('DB_MULTIPLE_ROWS_AFFECTED'));
            UserRouter.validateRowCount(rowCount <= 0, getResultCode('DB_NO_ROWS_AFFECTED'));
        }); 
    }

    public async postReturningObject(req: Request, res: Response, next: NextFunction) {
        await UserRouter.encapsulatedRequest(req, res, next, async () => {
            let dbRes;
            let model: User;
            let rowCount: number;
            let inserted = [];
            let insertedModel: User;

            let reqBody = req.body.data;
            //get object
            try {
                model = new User();
                model.clone(reqBody);
            } catch(e) {
                throw {exception: e, errorCode: getResultCode('MODEL_ERROR')};
            }
            //validate object
            try {
                model.validPostData();
            } catch(e) {
                throw {exception: e, errorCode: getResultCode('MODEL_EXCEPTION')};
            }
            // validate PK's
            let validationModels = [];

            let valModel01 = new User();
            valModel01.setEmail(model.getEmail());

            validationModels.push(valModel01);

            for(let model of validationModels) {
                try {
                    rowCount = await UserRouter.getDBConnector().runSQL(UserRouter.getSQLProvider().getCompost(model), 
                    UserRouter.getDBConnector().returnRowCount);
                    rowCount = +rowCount;
                } catch(e) {
                    throw {exception: e, errorCode: UserRouter.getDBConnector().getDBErrorCode(e)};
                }
                //validate return - rowCount > 0
                UserRouter.validateRowCount(rowCount > 0, getResultCode('DB_OBJECT_VIOLATION'));               
            }

            //query
            try {
                inserted = await UserRouter.getDBConnector().runSQL(UserRouter.getSQLProvider().post(model), 
                UserRouter.getDBConnector().returnAllRows);
            } catch(e) {
                throw {exception: e, errorCode: UserRouter.getDBConnector().getDBErrorCode(e)};
            }
            UserRouter.validateRowCount(inserted.length > 1, getResultCode('DB_MULTIPLE_ROWS_AFFECTED'));
            UserRouter.validateRowCount(inserted.length <= 0, getResultCode('DB_NO_ROWS_AFFECTED'));

            let insertedId = inserted[0].id;
            try {
                if (!reqBody.password || reqBody.password == '') throw 'Requisition body must contain the <password> property';
            } catch(e) {
                throw {exception: e, errorCode: getResultCode('MODEL_EXCEPTION')};
            }

            /** Insert authentication data */
            let authenticationModel = new Authentication();
            try {
                let hashedPassword = AuthenticationHelper.segurifyCredential(reqBody.password);
                authenticationModel.clone({
                    hash: hashedPassword.hash,
                    salt: hashedPassword.salt,
                    user_id: insertedId
                });
            } catch(e) {
                throw {exception: e, errorCode: getResultCode('MODEL_ERROR')};
            }
            try {
                rowCount = await UserRouter.getDBConnector().runSQL(UserRouter.getSQLProvider().postUserAuthentication(authenticationModel), 
                UserRouter.getDBConnector().returnRowCount);
                rowCount = +rowCount;
            } catch(e) {
                throw {exception: e, errorCode: UserRouter.getDBConnector().getDBErrorCode(e)};
            }
            UserRouter.validateRowCount(rowCount > 1, getResultCode('DB_MULTIPLE_ROWS_AFFECTED'));
            UserRouter.validateRowCount(rowCount <= 0, getResultCode('DB_NO_ROWS_AFFECTED'));

            // Get inserted object
            try {
                insertedModel = new User()
                insertedModel.setId(insertedId);
            } catch(e) {
                throw {exception: e, errorCode: getResultCode('MODEL_ERROR')};
            }
            // query
            try {
                dbRes = await UserRouter.getDBConnector().runSQL(UserRouter.getSQLProvider().get(insertedModel), 
                UserRouter.getDBConnector().returnFirstRow);
            } catch(e) {
                throw {exception: e, errorCode: UserRouter.getDBConnector().getDBErrorCode(e)};
            }
            // Merge all dependencies of object into returning data
            return await UserRouter.mergeDependencies(dbRes);
        }); 
    }

    public async put(req: Request, res: Response, next: NextFunction) {
        await UserRouter.encapsulatedRequest(req, res, next, async () => {
            let model: User;
            let rowCount: number;
            let dbRes;

            let reqBody = req.body.data;

            //get object
            try {
                model = new User();
                model.clone(reqBody);
            } catch(e) {
                throw {exception: e, errorCode: getResultCode('MODEL_ERROR')};
            }
            //validate object
            try {
                model.validPutData();
            } catch(e) {
                throw {exception: e, errorCode: getResultCode('MODEL_EXCEPTION')};
            }
            // validate PK's
            let validationModels = [];

            let valModel01 = new User();

            valModel01.setEmail(model.getEmail())
            validationModels.push(valModel01);

            for(let validation of validationModels) {
                try {
                    rowCount = await UserRouter.getDBConnector().runSQL(UserRouter.getSQLProvider().validationQuery(validation, model), 
                    UserRouter.getDBConnector().returnRowCount);
                    rowCount = +rowCount;
                } catch(e) {
                    throw {exception: e, errorCode: UserRouter.getDBConnector().getDBErrorCode(e)};
                }
                //validate return - rowCount > 0
                UserRouter.validateRowCount(rowCount > 0, getResultCode('DB_OBJECT_VIOLATION'));                 
            }

            //query
            try {
                rowCount = await UserRouter.getDBConnector().runSQL(UserRouter.getSQLProvider().put(model), 
                UserRouter.getDBConnector().returnRowCount);
                rowCount = +rowCount;
            } catch(e) {
                throw {exception: e, errorCode: UserRouter.getDBConnector().getDBErrorCode(e)};
            }
            UserRouter.validateRowCount(rowCount > 1, getResultCode('DB_MULTIPLE_ROWS_AFFECTED'));
            UserRouter.validateRowCount(rowCount <= 0, getResultCode('DB_NO_ROWS_AFFECTED'));
            

            if (reqBody.password && reqBody.password != '') {
                let authenticationModel = new Authentication();
                /** 
                 * Check if user already have a authentication profile
                 */
                try {
                    dbRes = await UserRouter.getDBConnector().runSQL(UserRouter.getSQLProvider().getUserAuthenticationByUserId(model), 
                    UserRouter.getDBConnector().returnFirstRow);
                } catch(e) {
                    throw {exception: e, errorCode: UserRouter.getDBConnector().getDBErrorCode(e)};
                } 

                let hashedPassword = AuthenticationHelper.segurifyCredential(reqBody.password);
                if (dbRes) {
                    authenticationModel.clone(dbRes);
                    /** Insert authentication data */
                    try {
                        authenticationModel.setHash(hashedPassword.hash);
                        authenticationModel.setSalt(hashedPassword.salt);
                    } catch(e) {
                        throw {exception: e, errorCode: getResultCode('MODEL_ERROR')};
                    }
                    try {
                        rowCount = await UserRouter.getDBConnector().runSQL(UserRouter.getSQLProvider().putUserAuthentication(authenticationModel), 
                        UserRouter.getDBConnector().returnRowCount);
                        rowCount = +rowCount;
                    } catch(e) {
                        throw {exception: e, errorCode: UserRouter.getDBConnector().getDBErrorCode(e)};
                    }
                    UserRouter.validateRowCount(rowCount > 1, getResultCode('DB_MULTIPLE_ROWS_AFFECTED'));
                    UserRouter.validateRowCount(rowCount <= 0, getResultCode('DB_NO_ROWS_AFFECTED'));
                } else {
                    /** Insert authentication data */
                    try {
                        authenticationModel.clone({
                            hash: hashedPassword.hash,
                            salt: hashedPassword.salt,
                            user_id: model.getId()
                        });
                    } catch(e) {
                        throw {exception: e, errorCode: getResultCode('MODEL_ERROR')};
                    }
                    try {
                        rowCount = await UserRouter.getDBConnector().runSQL(UserRouter.getSQLProvider().postUserAuthentication(authenticationModel), 
                        UserRouter.getDBConnector().returnRowCount);
                        rowCount = +rowCount;
                    } catch(e) {
                        throw {exception: e, errorCode: UserRouter.getDBConnector().getDBErrorCode(e)};
                    }
                    UserRouter.validateRowCount(rowCount > 1, getResultCode('DB_MULTIPLE_ROWS_AFFECTED'));
                    UserRouter.validateRowCount(rowCount <= 0, getResultCode('DB_NO_ROWS_AFFECTED'));
                }
            }
        });  
    }
    
    public async delete(req: Request, res: Response, next: NextFunction) {
        await UserRouter.encapsulatedRequest(req, res, next, async () => {
            let model: User;
            let rowCount: number;

            //get object
            try {
                model = new User();
                model.setId(req.params.id);
            } catch(e) {
                throw {exception: e, errorCode: getResultCode('MODEL_ERROR')};
            }

            // delete pending relations
            try {
                rowCount = await UserRouter.getDBConnector().runSQL(UserRouter.getSQLProvider().deleteUserAuthentication(model), 
                UserRouter.getDBConnector().returnRowCount);
                rowCount = +rowCount;
            } catch(e) {
                throw {exception: e, errorCode: UserRouter.getDBConnector().getDBErrorCode(e)};
            }
            //query
            try {
                rowCount = await UserRouter.getDBConnector().runSQL(UserRouter.getSQLProvider().delete(model), 
                UserRouter.getDBConnector().returnRowCount);
                rowCount = +rowCount;
            } catch(e) {
                throw {exception: e, errorCode: UserRouter.getDBConnector().getDBErrorCode(e)};
            }
            UserRouter.validateRowCount(rowCount > 1, getResultCode('DB_MULTIPLE_ROWS_AFFECTED'));
            UserRouter.validateRowCount(rowCount <= 0, getResultCode('DB_NO_ROWS_AFFECTED'));
        });  
    }
}

const UserRoutes = new UserRouter();
export default UserRoutes.router;
