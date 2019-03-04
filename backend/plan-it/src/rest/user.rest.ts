import { Request, Response, NextFunction } from 'express';

import { GenericRestResultCodes, GenericDBRest } from './generic.rest';
import { AuthenticationHelper } from '../core/authentication-manager';
import { Authentication } from '../model/authentication.model';
import { User } from '../model/user.model';

export class UserRouter extends GenericDBRest {

    private static RESULT_CODE_DATA_VALID_ERROR: string = '20';
 
    constructor() {
        super('user-sql-provider');
    }

    public init() {
        this.router.get('/', this.encapsulatedAuthenticatior, this.getAll);
        this.router.get('/:id', this.encapsulatedAuthenticatior, this.get);
        this.router.post('/', this.encapsulatedAuthenticatior, this.post);
        this.router.post('/returning_object', this.encapsulatedAuthenticatior, this.postReturningObject);
        this.router.put('/', this.encapsulatedAuthenticatior, this.put);
        this.router.delete('/:id', this.encapsulatedAuthenticatior, this.delete);
    }

    public encapsulatedAuthenticatior(req, res, next) {
        return UserRouter.authenticator(req, res, next);
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
        let dbRes;
        try {
            model.clone(data);
        } catch (e) {
            throw {exception: e, errorCode: GenericRestResultCodes.RESULT_CODE_MODEL_ERROR};
        }

        return model;
    }

    public async getAll(req: Request, res: Response, next: NextFunction) {
        // Verify if there is any optional parameters on req
        if (Object.keys(req.query).length > 0) {
            await UserRouter.encapsulatedRequest(req, res, async () => {
                let model: User;
                let dbRes;
                let data = [];

                // parse requisition query to a object
                try {
                    model = new User();
                    await model.clone(req.query);
                } catch(e) {
                    throw {exception: e, errorCode: GenericRestResultCodes.RESULT_CODE_MODEL_ERROR};
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
            await UserRouter.encapsulatedRequest(req, res, async () => {
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
        await UserRouter.encapsulatedRequest(req, res, async () => {
            let dbRes;
            let model: User;
            
            //get object
            try {
                model = new User();
                model.setId(req.params.id);
            } catch(e) {
                throw {exception: e, errorCode: GenericRestResultCodes.RESULT_CODE_MODEL_ERROR};
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
        await UserRouter.encapsulatedRequest(req, res, async () => {
            let model: User;
            let rowCount: number;
            let inserted = [];
            let reqBody = req.body.data;
            //get object
            try {
                model = new User();
                model.clone(reqBody);
            } catch(e) {
                throw {exception: e, errorCode: GenericRestResultCodes.RESULT_CODE_MODEL_ERROR};
            }
            //validate object
            try {
                model.validPostData();
            } catch(e) {
                throw {exception: e, errorCode: UserRouter.RESULT_CODE_DATA_VALID_ERROR};
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
                UserRouter.validateRowCount(rowCount > 0, GenericRestResultCodes.RESULT_CODE_DB_OBJECT_ALREADY_EXISTS);                
            }

            //query
            try {
                inserted = await UserRouter.getDBConnector().runSQL(UserRouter.getSQLProvider().post(model), 
                UserRouter.getDBConnector().returnAllRows);
            } catch(e) {
                throw {exception: e, errorCode: UserRouter.getDBConnector().getDBErrorCode(e)};
            }
            //validate return - rowCount > 1
            UserRouter.validateRowCount(inserted.length > 1, GenericRestResultCodes.RESULT_CODE_DB_MORE_THAN_ONE_ROW);
            //validate return - rowCount <= 0
            UserRouter.validateRowCount(inserted.length <= 0, GenericRestResultCodes.RESULT_CODE_DB_LESS_EQUAL_ZERO_ROW);

            let insertedId = inserted[0].id;
            try {
                if (!reqBody.password || reqBody.password == '') throw 'Requisition body must contain the <password> property'
            } catch(e) {
                throw {exception: e, errorCode: GenericRestResultCodes.RESULT_CODE_MODEL_ERROR};
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
                throw {exception: e, errorCode: UserRouter.RESULT_CODE_DATA_VALID_ERROR};
            }
            try {
                rowCount = await UserRouter.getDBConnector().runSQL(UserRouter.getSQLProvider().postUserAuthentication(authenticationModel), 
                UserRouter.getDBConnector().returnRowCount);
                rowCount = +rowCount;
            } catch(e) {
                throw {exception: e, errorCode: UserRouter.getDBConnector().getDBErrorCode(e)};
            }
            UserRouter.validateRowCount(rowCount > 1, GenericRestResultCodes.RESULT_CODE_DB_MORE_THAN_ONE_ROW);
            UserRouter.validateRowCount(rowCount <= 0, GenericRestResultCodes.RESULT_CODE_DB_LESS_EQUAL_ZERO_ROW);
        }); 
    }

    public async postReturningObject(req: Request, res: Response, next: NextFunction) {
        await UserRouter.encapsulatedRequest(req, res, async () => {
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
                throw {exception: e, errorCode: GenericRestResultCodes.RESULT_CODE_MODEL_ERROR};
            }
            //validate object
            try {
                model.validPostData();
            } catch(e) {
                throw {exception: e, errorCode: UserRouter.RESULT_CODE_DATA_VALID_ERROR};
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
                UserRouter.validateRowCount(rowCount > 0, GenericRestResultCodes.RESULT_CODE_DB_OBJECT_ALREADY_EXISTS);                
            }

            //query
            try {
                inserted = await UserRouter.getDBConnector().runSQL(UserRouter.getSQLProvider().post(model), 
                UserRouter.getDBConnector().returnAllRows);
            } catch(e) {
                throw {exception: e, errorCode: UserRouter.getDBConnector().getDBErrorCode(e)};
            }
            //validate return - rowCount > 1
            UserRouter.validateRowCount(inserted.length > 1, GenericRestResultCodes.RESULT_CODE_DB_MORE_THAN_ONE_ROW);
            //validate return - rowCount <= 0
            UserRouter.validateRowCount(inserted.length <= 0, GenericRestResultCodes.RESULT_CODE_DB_LESS_EQUAL_ZERO_ROW);

            let insertedId = inserted[0].id;
            try {
                if (!reqBody.password || reqBody.password == '') throw 'Requisition body must contain the <password> property';
            } catch(e) {
                throw {exception: e, errorCode: GenericRestResultCodes.RESULT_CODE_MODEL_ERROR};
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
                throw {exception: e, errorCode: UserRouter.RESULT_CODE_DATA_VALID_ERROR};
            }
            try {
                rowCount = await UserRouter.getDBConnector().runSQL(UserRouter.getSQLProvider().postUserAuthentication(authenticationModel), 
                UserRouter.getDBConnector().returnRowCount);
                rowCount = +rowCount;
            } catch(e) {
                throw {exception: e, errorCode: UserRouter.getDBConnector().getDBErrorCode(e)};
            }
            UserRouter.validateRowCount(rowCount > 1, GenericRestResultCodes.RESULT_CODE_DB_MORE_THAN_ONE_ROW);
            UserRouter.validateRowCount(rowCount <= 0, GenericRestResultCodes.RESULT_CODE_DB_LESS_EQUAL_ZERO_ROW);

            // Get inserted object
            try {
                insertedModel = new User()
                insertedModel.setId(insertedId);
            } catch(e) {
                throw {exception: e, errorCode: GenericRestResultCodes.RESULT_CODE_MODEL_ERROR};
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
        await UserRouter.encapsulatedRequest(req, res, async () => {
            let model: User;
            let equipments = [];
            let rowCount: number;
            let dbRes;

            let reqBody = req.body.data;

            //get object
            try {
                model = new User();
                model.clone(reqBody);
            } catch(e) {
                throw {exception: e, errorCode: GenericRestResultCodes.RESULT_CODE_MODEL_ERROR};
            }
            //validate object
            try {
                model.validPutData();
            } catch(e) {
                throw {exception: e, errorCode: UserRouter.RESULT_CODE_DATA_VALID_ERROR};
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
                UserRouter.validateRowCount(rowCount > 0, GenericRestResultCodes.RESULT_CODE_DB_OBJECT_ALREADY_EXISTS);                
            }

            //query
            try {
                rowCount = await UserRouter.getDBConnector().runSQL(UserRouter.getSQLProvider().put(model), 
                UserRouter.getDBConnector().returnRowCount);
                rowCount = +rowCount;
            } catch(e) {
                throw {exception: e, errorCode: UserRouter.getDBConnector().getDBErrorCode(e)};
            }
            //validate return - rowCount > 1
            UserRouter.validateRowCount(rowCount > 1, GenericRestResultCodes.RESULT_CODE_DB_MORE_THAN_ONE_ROW);
            //validate return - rowCount <= 0
            UserRouter.validateRowCount(rowCount <= 0, GenericRestResultCodes.RESULT_CODE_DB_LESS_EQUAL_ZERO_ROW);
            

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
                        throw {exception: e, errorCode: UserRouter.RESULT_CODE_DATA_VALID_ERROR};
                    }
                    try {
                        rowCount = await UserRouter.getDBConnector().runSQL(UserRouter.getSQLProvider().putUserAuthentication(authenticationModel), 
                        UserRouter.getDBConnector().returnRowCount);
                        rowCount = +rowCount;
                    } catch(e) {
                        throw {exception: e, errorCode: UserRouter.getDBConnector().getDBErrorCode(e)};
                    }
                    UserRouter.validateRowCount(rowCount > 1, GenericRestResultCodes.RESULT_CODE_DB_MORE_THAN_ONE_ROW);
                    UserRouter.validateRowCount(rowCount <= 0, GenericRestResultCodes.RESULT_CODE_DB_LESS_EQUAL_ZERO_ROW);
                } else {
                    /** Insert authentication data */
                    try {
                        authenticationModel.clone({
                            hash: hashedPassword.hash,
                            salt: hashedPassword.salt,
                            user_id: model.getId()
                        });
                    } catch(e) {
                        throw {exception: e, errorCode: UserRouter.RESULT_CODE_DATA_VALID_ERROR};
                    }
                    try {
                        rowCount = await UserRouter.getDBConnector().runSQL(UserRouter.getSQLProvider().postUserAuthentication(authenticationModel), 
                        UserRouter.getDBConnector().returnRowCount);
                        rowCount = +rowCount;
                    } catch(e) {
                        throw {exception: e, errorCode: UserRouter.getDBConnector().getDBErrorCode(e)};
                    }
                    UserRouter.validateRowCount(rowCount > 1, GenericRestResultCodes.RESULT_CODE_DB_MORE_THAN_ONE_ROW);
                    UserRouter.validateRowCount(rowCount <= 0, GenericRestResultCodes.RESULT_CODE_DB_LESS_EQUAL_ZERO_ROW);
                }
            }
        });  
    }
    
    public async delete(req: Request, res: Response, next: NextFunction) {
        await UserRouter.encapsulatedRequest(req, res, async () => {
            let model: User;
            let rowCount: number;

            //get object
            try {
                model = new User();
                model.setId(req.params.id);
            } catch(e) {
                throw {exception: e, errorCode: GenericRestResultCodes.RESULT_CODE_MODEL_ERROR};
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
            //validate return - rowCount > 1
            UserRouter.validateRowCount(rowCount > 1, GenericRestResultCodes.RESULT_CODE_DB_MORE_THAN_ONE_ROW);
            //validate return - rowCount <= 0
            UserRouter.validateRowCount(rowCount <= 0, GenericRestResultCodes.RESULT_CODE_DB_LESS_EQUAL_ZERO_ROW);
        });  
    }
}

const UserRoutes = new UserRouter();
export default UserRoutes.router;
