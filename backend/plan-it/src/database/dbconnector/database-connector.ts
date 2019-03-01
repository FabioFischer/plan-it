
const uuidv4 = require('uuid/v4');

export enum DatabaseConnectionType {POSTGRESQL = 'POSTGRESQL'};

export abstract class DatabaseConnector {

    public static RESULT_CODE_DB_VIOLATION_INTEGRITY: string = '12-2000'
    public static RESULT_CODE_DB_VIOLATION_RESTRICT: string = '12-2001'
    public static RESULT_CODE_DB_VIOLATION_NOT_NULL: string = '12-2002'
    public static RESULT_CODE_DB_VIOLATION_FK: string = '12-2003'
    public static RESULT_CODE_DB_VIOLATION_PK: string = '12-2004'
    public static RESULT_CODE_DB_VIOLATION_CK: string = '12-2005'
    public static RESULT_CODE_DB_VIOLATION_EXCLUSION: string = '12-2006'

    private sqlConnectorType: DatabaseConnectionType;
    private sqlProviderFolder: string;
    private queryCache: Map<string, QueryCache>;


    constructor (sqlConnectorType: DatabaseConnectionType, sqlProviderFolder: string){
        this.setSQLConnectorType(sqlConnectorType);
        this.setSQLProviderFolder(sqlProviderFolder);
        this.setQueryCache(new Map());
    }

    public getSQLConnectorType(): DatabaseConnectionType {
        return this.sqlConnectorType;
    }

    public setSQLConnectorType(sqlConnectorType: DatabaseConnectionType){
        this.sqlConnectorType = sqlConnectorType;
    }
    
    public getSQLProviderFolder(): string {
        return this.sqlProviderFolder;
    }

    public setSQLProviderFolder(sqlProviderFolder: string){
        this.sqlProviderFolder = sqlProviderFolder;
    }
        
    public getQueryCache(): Map<string, QueryCache> {
        return this.queryCache;
    }

    public setQueryCache(queryCache: Map<string, QueryCache>){
        this.queryCache = queryCache;
    }

    public addQueryCache(): string {
        let hash: string = uuidv4();
        this.queryCache.set(hash, new QueryCache());
        return hash;
    }

    public removeQueryCache(hash: string) {
        this.queryCache.delete(hash);
    }

    public getQueryCacheElement(hash: string): QueryCache {
        return this.queryCache.get(hash);
    }

    public async getSQLPrividerNamespace(sqlProviderFile: string){
        const sqlProvider = await import('../' + this.getSQLProviderFolder() + '/' + sqlProviderFile);
        switch (this.getSQLConnectorType()) {
            case DatabaseConnectionType.POSTGRESQL:
                return sqlProvider.PostgreSQL ;
            default:
                throw `Database type ${this.getSQLConnectorType()} is not defined.`;
        }
    }

    public abstract getDBErrorCode(e: any): string;
    public abstract async runSQL(sql: string, returnType: Function, cacheId?: string);
    public abstract async returnAllRows(dbResponse);
    public abstract async returnFirstRow(dbResponseres);
    public abstract async returnNothing(dbResponse);
    public abstract async returnRowCount(dbResponse);
    public abstract async returnLastRowCount(dbResponse);
    
}

export class QueryCache {

    private queryCacheElements: QueryCacheElement[];

    constructor() {
        this.queryCacheElements = [];
    }

    public findElement(sql: string,  returnType: Function): any {
        return this.queryCacheElements.filter(el => el.sql == sql && el.returnType == returnType)[0];
    }

    public addElement(sql: string, returnType: Function, returnValue: any){
        this.queryCacheElements.push(new QueryCacheElement(sql, returnType, returnValue))
    }

}

export class QueryCacheElement {
    public sql: string; 
    public returnType: Function;
    public returnValue: any;    
    
    constructor (sql: string, returnType: Function, returnValue: any) {
        this.sql = sql;
        this.returnType = returnType;
        this.returnValue = returnValue;
    }

}

