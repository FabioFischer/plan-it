import { GenericDBRequester } from '../database/dbconnector/generic.dbrequester';

const sqlProviderFile: string = 'requisition-log-sql-provider'

export class RequisitionLog {    
    private id: number;
	private begin_date: Date;
	private end_date: Date;
	private user_id: number;
	private method: string;
	private endpoint: string;
	private params: string;
	private req_body: string;
	private res_status: string;
	private res_code: string;
	private res_body: string;

    public setId(id): void {
        if (id == undefined) {
            this.id = id;
        } else {
            if (isNaN(id)){
                throw 'field <id> from <requisition-log> object must be numeric';
            }        
            this.id = +id;
        }
    }       

    public getId(): number {
        return this.id;
    }

    public getBeginDate(): Date {
        return this.begin_date;
    }

    public setBeginDate(begin_date): void {
        this.begin_date = begin_date;
    }

    public getEndDate(): Date {
        return this.end_date;
    }

    public setEndDate(end_date): void {
        this.end_date = end_date;
    }

    public getUserId(): number {
        return this.user_id;
    }

    public setUserId(user_id): void {
        if (user_id == undefined) {
            this.user_id = user_id;
        } else {
            if (isNaN(user_id)){
                throw 'field <user_id> from <requisition-log> object must be numeric';
            }        
            this.user_id = +user_id;
        }
    }

    public getMethod(): string {
        return this.method;
    }

    public setMethod(method): void {
        this.method = method;
    }

    public getEndPoint(): string {
        return this.endpoint;
    }

    public setEndPoint(endpoint): void {
        this.endpoint = endpoint;
    }

    public getParams(): string {
        return this.params;
    }

    public setParams(params): void {
        this.params = params;
    }

    public getReqBody(): string {
        return this.req_body;
    }

    public setReqBody(req_body): void {
        this.req_body = req_body;
    }

    public getResStatus(): string {
        return this.res_status;
    }

    public setResStatus(res_status): void {
        this.res_status = res_status;
    }

    public getResCode(): string {
        return this.res_code;
    }

    public setResCode(res_code): void {
        this.res_code = res_code;
    }

    public getResBody(): string {
        return this.res_body;
    }

    public setResBody(res_body): void {
        this.res_body = res_body;
    }

    clone(clone): void {
        this.setId(clone.id);
        this.setBeginDate(clone.begin_date);
        this.setEndDate(clone.end_date);
        this.setUserId(clone.user_id);
        this.setMethod(clone.method);
        this.setEndPoint(clone.end_point);
        this.setParams(clone.params);
        this.setReqBody(clone.req_body);
        this.setResStatus(clone.res_status);
        this.setResCode(clone.res_code);
        this.setResBody(clone.res_body);
    }
}

export class RequisitionLogger {

    public static dbRequester: GenericDBRequester;

    constructor() {
        this.configureDBRequester(sqlProviderFile);
    }

    public async configureDBRequester(sqlProviderFile: string){
        await this.setDBRequester(await new GenericDBRequester());
        let dbRequester: GenericDBRequester = await this.getDBRequester();
        await dbRequester.loadDatabaseDependencies(sqlProviderFile);
        dbRequester.sqlProvider = await new dbRequester.namespace.DefaultRequisitionLogSQLProvider(); 
    }

    public getDBRequester(){
        return RequisitionLogger.dbRequester;
    }

    public setDBRequester(dbRequester){
        RequisitionLogger.dbRequester = dbRequester;
    }

    public static getSQLProvider() {
        return RequisitionLogger.dbRequester.sqlProvider;
    }

    public static getDBConnector() {
        return RequisitionLogger.dbRequester.dbConnector;
    }
    
    public async log(requisitionLogModel: RequisitionLog) {
        await RequisitionLogger.getDBConnector().runSQL(RequisitionLogger.getSQLProvider().post(requisitionLogModel), RequisitionLogger.getDBConnector().returnAllRows);
    }    
} 