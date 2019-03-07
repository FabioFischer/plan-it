import { GenericPostgreSQLProvider } from './generic-sql-provider';
import { Authentication } from '../../model/authentication.model';
import { User } from '../../model/user.model'

export namespace PostgreSQL {

    export class DefaultUserSQLProvider extends GenericPostgreSQLProvider {

        public getAll(): string {
            return `SELECT *
                    FROM t_user
                    ORDER BY name;`;
        }

        public get(model: User): string {
            return `SELECT *
                    FROM t_user
                    WHERE ${super.toQueryConditionFormat('id', model.getId())}`;
        }

        public validationQuery(validation: User, model: User): string {
            if (validation) {
                return `SELECT * 
                        FROM t_user
                        ${super.toCompostQuery(validation)}
                        AND id <> ${model.getId()}`;
            }
            return '';
        }

        public getCompost(model: User): string {
            return `SELECT * 
                    FROM t_user
                    ${super.toCompostQuery(model)}
                    ORDER BY name`;
        }

        public post(model: User): string {
            return `INSERT INTO t_user (
                        email,
                        name
                    )
                    VALUES (
                        ${super.getQueryValueString(model.getEmail())},
                        ${super.getQueryValueString(model.getName())}
                    ) RETURNING id`;
        }
        
        public postUserAuthentication(model: Authentication): string {
            return `INSERT INTO t_user_auth (user_id, hash, salt)
                    VALUES (
                        ${super.getQueryValueString(model.getUserId())},
                        ${super.getQueryValueString(model.getHash())},
                        ${super.getQueryValueString(model.getSalt())}
                    );`;
        }

        public put(model: User): string {
            return `UPDATE t_user 
                    SET email = ${super.getQueryValueString(model.getEmail())},
                        name = ${super.getQueryValueString(model.getName())}
                    WHERE ${super.toQueryConditionFormat('id', model.getId())};`;
        }
        
        public delete(model: User): string {
            return `DELETE FROM t_user
                     WHERE ${super.toQueryConditionFormat('id', model.getId())}`;
        }

        public deleteUserAuthentication(model: User): string {
            return `DELETE FROM t_user_auth
                     WHERE ${super.toQueryConditionFormat('id', model.getId())}`;
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