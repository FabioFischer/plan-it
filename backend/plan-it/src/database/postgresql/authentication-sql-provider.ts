import { GenericPostgreSQLProvider } from './generic-sql-provider';
import { Authentication } from '../../model/authentication.model';
import { User } from '../../model/user.model'

export namespace PostgreSQL {

    export class DefaultAuthenticationSQLProvider extends GenericPostgreSQLProvider {

        public get(model: User): string {
            return `SELECT * 
                      FROM t_user
                     WHERE ${super.toQueryConditionFormat('id', model.getId())};`;
        }

        public getUserAuthentication(model: User): string {
            return `SELECT usa.* 
                        FROM t_user_auth usa
                        INNER JOIN t_user usr
                        ON usa.user_id = usr.id
                    WHERE ${super.toQueryConditionFormat('usr.email', model.getEmail())};`;
        }

        public getUserAuthenticationByUserId(model: Authentication): string {
            return `SELECT usa.* 
                      FROM t_user_auth usa
                      INNER JOIN t_user usr
                        ON usa.user_id = usr.id
                    WHERE ${super.toQueryConditionFormat('usr.id', model.getUserId())};`;
        }

        public putUserAuthentication(model: Authentication): string {
            return `UPDATE t_user_auth 
                    SET user_id = ${super.getQueryValueString(model.getUserId())},
                        hash = ${super.getQueryValueString(model.getHash())},
                        salt = ${super.getQueryValueString(model.getSalt())}
                    WHERE ${super.toQueryConditionFormat('user_id', model.getUserId())};`;
        }
    }
}