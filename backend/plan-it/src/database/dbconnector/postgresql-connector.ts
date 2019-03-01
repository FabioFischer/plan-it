import { DatabaseConnector, DatabaseConnectionType, QueryCacheElement } from "./database-connector";
import { LoggerController, StaticLogger, LogFrom } from '../../core/logger-controller.core';
import { GenericRestResultCodes } from "../../rest/generic.rest";

const SQL_PROVIDER_FOLDER: string = 'postgresql';

export class PostgreSQLConnector extends DatabaseConnector {
    
    private dbHost: string;
    private dbPort: string;
    private dbDatabase: string;
    private dbUser: string;
    private dbPassword: string;

    private pool;

    constructor(dbHost: string, dbPort: string, dbDatabase: string, dbUser: string, dbPassword: string){
        super(DatabaseConnectionType.POSTGRESQL, SQL_PROVIDER_FOLDER);
        this.setDBHost(dbHost);
        this.setDBPort(dbPort);
        this.setDBDatabase(dbDatabase);
        this.setDBUser(dbUser);
        this.setDBPassword(dbPassword);
        const { Pool } = require('pg')

        this.pool = new Pool({
            user: this.dbUser,
            host: this.dbHost,
            database: this.dbDatabase,
            password: this.dbPassword,
            port: this.dbPort,
        });

        this.pool.on('error', (err, client) => {
            console.error('Unexpected error on idle client', err)
        });
    }

    public getDBHost(): string {
        return this.dbHost;
    }

    public setDBHost(dbHost: string){
        this.dbHost = dbHost;
    }

    public getDBPort(): string {
        return this.dbPort;
    }

    public setDBPort(dbPort: string){
        this.dbPort = dbPort;
    }

    public getDBDatabase(): string {
        return this.dbDatabase;
    }

    public setDBDatabase(dbDatabase: string){
        this.dbDatabase = dbDatabase;
    }

    public getDBUser(): string {
        return this.dbUser;
    }

    public setDBUser(dbUser: string){
        this.dbUser = dbUser;
    }

    public getDBPassword(): string {
        return this.dbPassword;
    }

    public setDBPassword(dbPassword: string){
        this.dbPassword = dbPassword;
    }

    public getDBErrorCode(e: any): string {
        if (e && e.code){
            switch (e.code){
                case '23000':
                    return DatabaseConnector.RESULT_CODE_DB_VIOLATION_INTEGRITY;
                case '23001':
                    return DatabaseConnector.RESULT_CODE_DB_VIOLATION_RESTRICT;
                case '23502':
                    return DatabaseConnector.RESULT_CODE_DB_VIOLATION_NOT_NULL;
                case '23503':
                    return DatabaseConnector.RESULT_CODE_DB_VIOLATION_FK;
                case '23505':
                    return DatabaseConnector.RESULT_CODE_DB_VIOLATION_PK;
                case '23514':
                    return DatabaseConnector.RESULT_CODE_DB_VIOLATION_CK;
                case '23P01':
                    return DatabaseConnector.RESULT_CODE_DB_VIOLATION_EXCLUSION;
            }
        }
        return GenericRestResultCodes.RESULT_CODE_DB_ERROR;
    }

    public async runSQL(sql: string, returnType: Function, cacheId?: string) {
        let returnValue;
        // Pool manages his available clients and returns when/if there's a available obj
        let client = await this.pool.connect();
        try {
            if (cacheId && super.getQueryCacheElement(cacheId)) {
                let cacheValue: QueryCacheElement = await super.getQueryCacheElement(cacheId).findElement(sql, returnType);
                if (cacheValue) {
                    returnValue = cacheValue.returnValue;
                } else {
                    let dbResponse = await client.query(sql);
                    returnValue = await returnType(dbResponse);
                    await super.getQueryCacheElement(cacheId).addElement(sql, returnType, returnValue);
                }
            } else {
                let dbResponse = await client.query(sql);
                returnValue = await returnType(dbResponse);
            }
        } catch(e) {
            throw new Error(e);
        } finally {
            client.release();
        }
        return returnValue;        
    }

    public async returnAllRows(dbResponse){
        return dbResponse.rows;
    }

    public async returnFirstRow(dbResponse){
        return dbResponse.rows[0];
    }
    
    public async returnNothing(dbResponse){
        return null;
    }

    public async returnRowCount(dbResponse){
        return dbResponse.rowCount;
    }

    public async returnLastRowCount(dbResponse) {
        if (dbResponse && dbResponse instanceof Array) {
            return dbResponse[dbResponse.length-1].rowCount;
        }
        return dbResponse.rowCount;
    }
}