import { Request, Response, NextFunction } from 'express';

import { GenericDBRest, getResultCode } from './generic.rest';
import { AuthenticationHelper } from '../core/authentication-manager';
import { Authentication } from '../model/authentication.model';
import { User } from '../model/user.model';

export class AuthenticationRouter extends GenericDBRest {

    private static RESULT_CODE_DATA_VALID_ERROR: string = '20';
 
    constructor() {
        super('authentication-sql-provider');
    }

    public init() {
        this.router.post('/login', this.preRequisitionHandler, this.login, this.postRequisitionHandler);
        this.router.post('/logout', this.preRequisitionHandler, this.logout, this.postRequisitionHandler);
        this.router.get('/token', this.preRequisitionHandler, this.authenticationHandler, this.token, this.postRequisitionHandler);
        this.router.put('/change_password', this.preRequisitionHandler, this.authenticationHandler, this.changePassword, this.postRequisitionHandler);
    }

    public async preRequisitionHandler(req: Request, res: Response, next: NextFunction) {
        return await AuthenticationRouter.startRequisition(req, res, next);    
    }

    public async authenticationHandler(req, res, next) {
        return await AuthenticationRouter.authenticateRequisition(req, res, next);
    }

    public async postRequisitionHandler(req, res, next) {
        return await AuthenticationRouter.requisitionLogger(req, res, next);
    }

    public async setupSQLProvider(namespace){       
        this.setSQLProvider(new namespace.DefaultAuthenticationSQLProvider());
    }

    public getDBRequester() {
        return AuthenticationRouter.dbRequester;
    }

    public setDBRequester(dbRequester: any) {
        AuthenticationRouter.dbRequester = dbRequester;
    }

    public static getSQLProvider() {
        return AuthenticationRouter.dbRequester.sqlProvider;
    }

    public static getDBConnector() {
        return AuthenticationRouter.dbRequester.dbConnector;
    }

    public static async mergeDependencies(data): Promise<any> {
        let dbRes;
        let model = new User();
        try {
            model.clone(data);
        } catch (e) {
            throw {exception: e, errorCode: getResultCode('MODEL_ERROR')};
        }
        return model;
    }

    public async login(req: Request, res: Response, next: NextFunction) {
        await AuthenticationRouter.encapsulatedRequest(req, res, next, async () => {
            let authenticatedModel = new Authentication();
            let user = new User();
            let reqBody = req.body.data;
            let dbRes = [];
            
            console.log(reqBody)

            try {
                if (!reqBody) throw 'Requisition body not found';
                if (!reqBody.email) throw 'Requisition body must contain the <email> property';
                if (!reqBody.password) throw 'Requisition body must contain the <password> property';

                user.setEmail(reqBody.email)
            } catch(e) {
                throw {exception: e, errorCode: getResultCode('MODEL_EXCEPTION')};
            }
            try {
                dbRes = await AuthenticationRouter.getDBConnector().runSQL(AuthenticationRouter.getSQLProvider().getUserAuthentication(user), 
                AuthenticationRouter.getDBConnector().returnFirstRow);

                if (dbRes == null) {
                    throw 'Invalid Credentials';
                }

                authenticatedModel.clone(dbRes);
                if (!authenticatedModel.getUserId() || authenticatedModel.getUserId() === 0) {
                    throw 'User authenticated model not found';
                }
            } catch(e) {
                throw {exception: e, errorCode: getResultCode('INVALID_CREDENTIALS')};
            }

            try {
                user.setId(authenticatedModel.getUserId());

                dbRes = await AuthenticationRouter.getDBConnector().runSQL(AuthenticationRouter.getSQLProvider().get(user), 
                AuthenticationRouter.getDBConnector().returnFirstRow);
                
                if (dbRes == null) {
                    throw 'User not found';
                }
                user.clone(dbRes);
            } catch(e) {
                throw {exception: e, errorCode: AuthenticationRouter.getDBConnector().getDBErrorCode(e)};
            }

            try {
                /* 
                * Validate password
                */
                if (!AuthenticationHelper.verifyCredential(reqBody.senha, authenticatedModel.getHash(), authenticatedModel.getSalt())) {
                    throw 'Invalid Credentials';
                }
                /*
                * Merge User dependencies and generate new signed token
                */
                let normalizedModel = await AuthenticationRouter.mergeDependencies(user);
                AuthenticationRouter.appendResponseHeader(res, process.env.TOKEN_HEADER_DEFINITION, AuthenticationHelper.createToken(normalizedModel));
            } catch (e) {
                throw {exception: e, errorCode: getResultCode('INVALID_CREDENTIALS')};
            }

            /**
             * Set the requisition User as the current login model
             */
            try {
                await AuthenticationRouter.setAccessToken(req, user);
            } catch(e) {
                throw {exception: e, errorCode: getResultCode('INVALID_CREDENTIALS')};
            }
        });
    }

    public async logout(req: Request, res: Response, next: NextFunction) {
        await AuthenticationRouter.encapsulatedRequest(req, res, next, async () => {
            /**
             * Does nothing right now
             */
            return;
        });
    }

    public async token(req: Request, res: Response, next: NextFunction) {
        await AuthenticationRouter.encapsulatedRequest(req, res, next, async () => {
            let model: User;
            /*
            * Generate new signed token
            */
            AuthenticationRouter.appendResponseHeader(res, process.env.TOKEN_HEADER_DEFINITION, AuthenticationHelper.createToken(model));
            return AuthenticationRouter.mergeDependencies(model);
        });
    }

    public async changePassword(req: Request, res: Response, next: NextFunction) {
        await AuthenticationRouter.encapsulatedRequest(req, res, next, async () => {
            let dbRes;
            let model: Authentication;
            let rowCount: number;
            let reqBody = req.body.data;

            try {
                if (!reqBody) throw 'Requisition body not found';
                if (!reqBody.prev_password) throw 'Requisition body must contain the <prev_password> property';
                if (!reqBody.new_password) throw 'Requisition body must contain the <new_password> property';

                model = new Authentication();
                model.clone(reqBody);
                if (!model.getUserId()){
                    throw 'User not found';
                }
            } catch(e) {
                throw {exception: e, errorCode: getResultCode('UNATHENTICATED')};
            }

            try {
                dbRes = await AuthenticationRouter.getDBConnector().runSQL(AuthenticationRouter.getSQLProvider().getUserAuthenticationByUserId(model), 
                AuthenticationRouter.getDBConnector().returnFirstRow);

                if (dbRes == null) {
                    throw 'Invalid Credentials';
                }
                model.clone(dbRes);
            } catch(e) {
                throw {exception: e, errorCode: getResultCode('INVALID_CREDENTIALS')};
            }

            /** Validate previous password */
            try {
                if (!AuthenticationHelper.verifyCredential(reqBody.prev_password, model.getHash(), model.getSalt())) {
                    throw 'Invalid Credentials';
                }
            } catch (e) {
                throw {exception: e, errorCode: getResultCode('INVALID_CREDENTIALS')};
            }

            /** Insert authentication data */
            try {
                let hashedPassword = AuthenticationHelper.segurifyCredential(reqBody.new_password);
                model.setHash(hashedPassword.hash);
                model.setSalt(hashedPassword.salt);
            } catch(e) {
                throw {exception: e, errorCode: AuthenticationRouter.RESULT_CODE_DATA_VALID_ERROR};
            }
            
            try {
                rowCount = await AuthenticationRouter.getDBConnector().runSQL(AuthenticationRouter.getSQLProvider().putUserLogin(model), 
                AuthenticationRouter.getDBConnector().returnRowCount);
                rowCount = +rowCount;
            } catch(e) {
                throw {exception: e, errorCode: AuthenticationRouter.getDBConnector().getDBErrorCode(e)};
            }
        });
    }
}

const authenticationRoutes = new AuthenticationRouter();
export default authenticationRoutes.router;