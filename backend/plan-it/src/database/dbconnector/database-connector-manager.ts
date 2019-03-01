import { DatabaseConnector, DatabaseConnectionType } from './database-connector';
import { PostgreSQLConnector } from './postgresql-connector';

export class DatabaseConnectorManager {
    
    private static instance: DatabaseConnector;

    static getDatabaseConnectorInstance(): DatabaseConnector {
        if (!DatabaseConnectorManager.instance) {
            DatabaseConnectorManager.instance = this.getDatabaseInstance();
        }
        return DatabaseConnectorManager.instance;
    }

    private static getDatabaseInstance(): DatabaseConnector {
        switch (process.env.DATABASE_TYPE) {
            case DatabaseConnectionType['POSTGRESQL']:
                return new PostgreSQLConnector(process.env.PGS_HOST, 
                                               process.env.PGS_PORT, 
                                               process.env.PGS_DATABASE, 
                                               process.env.PGS_USER,
                                               process.env.PGS_PASSWORD);
            default:
                throw `Database type ${process.env.DATABASE_TYPE} is not defined. Verify the enviroment variables.`;
        }
    }
}
