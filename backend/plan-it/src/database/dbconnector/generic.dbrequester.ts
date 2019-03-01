import { DatabaseConnector } from "./database-connector";
import { DatabaseConnectorManager } from "./database-connector-manager";

export class GenericDBRequester {

    public dbConnector: DatabaseConnector;
    public sqlProvider;
    public namespace;
    
    constructor(){} 

    public async loadDatabaseDependencies(sqlProviderFile: string){
        this.dbConnector = await DatabaseConnectorManager.getDatabaseConnectorInstance();
        this.namespace = await this.dbConnector.getSQLPrividerNamespace(sqlProviderFile);
    }
    
    public setSqlProvider(sqlProvider){
        this.sqlProvider = sqlProvider;
    }

}

