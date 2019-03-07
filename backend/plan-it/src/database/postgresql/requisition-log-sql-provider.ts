import { GenericPostgreSQLProvider } from './generic-sql-provider';
import { RequisitionLog } from '../../core/requisition-logger.core';

export namespace PostgreSQL {

    export class DefaultRequisitionLogSQLProvider extends GenericPostgreSQLProvider {

        public post(model: RequisitionLog): string {
            return `INSERT INTO t_requisition_log (
                        begin_date,
                        end_date,
                        user_id,
                        method,
                        endpoint,
                        params,
                        req_body,
                        res_status,
                        res_code,
                        res_body
                    )
                    VALUES (
                        ${super.getQueryValueString(model.getBeginDate().toISOString())},
                        ${super.getQueryValueString(model.getEndDate().toISOString())},
                        ${super.getQueryValueString(model.getUserId())},
                        ${super.getQueryValueString(model.getMethod())},
                        ${super.getQueryValueString(model.getEndPoint())},
                        ${super.getQueryValueString(model.getParams())},
                        ${super.getQueryValueString(model.getReqBody())},
                        ${super.getQueryValueString(model.getResStatus())},
                        ${super.getQueryValueString(model.getResCode())},
                        ${super.getQueryValueString(model.getResBody())}
                    ) RETURNING id`;
        }
    }
}