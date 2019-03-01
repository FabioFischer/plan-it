import { GenericOption } from "../../model/generic-option.model";

export const postgreEscapes: {char: string, escape: string}[] = [
    {
        char: '\'',
        escape: '\'\''
    }
]

export class GenericPostgreSQLProvider {

    public escapeString(str: string): string {
        let aux = str;
        if (typeof str == 'string' && postgreEscapes && postgreEscapes instanceof Array && postgreEscapes.length > 0) {
            for (let escape of postgreEscapes)
                aux = str.replace(new RegExp(escape.char, 'g'), escape.escape);
        }
        return aux;
    }

    public getQueryFieldString(field: any): string {
        return field;
    }

    public getQueryValueString(value: any, crosstab?: boolean): string {
        if(value instanceof Array) {
            let str: string = '';
            for(let i of value) {
                str = `${str}${str == '' ? `${this.getQueryValueString(i, crosstab)}` : `,${this.getQueryValueString(i, crosstab)}`}`;
            }
            return str;
        }
        if (value instanceof Date) {
            return `'${value.toISOString()}'`;
        } else if(value == undefined) {
            return null
        } else {
            if (value != null && typeof value != 'object') {
                switch (typeof value) {
                    case 'string': { return `'${crosstab ? `'${this.escapeString(value)}'` : this.escapeString(value)}'`;  }
                    case 'number': { return `${value}`; }
                    case 'boolean': { return (value) ? '1' : '0'; }
                    default: { return `${value}`; }
                }
            }
            return value;
        }
    }

    public toQueryConditionFormat(field: string, value: any): string {
        if (value instanceof Array) {
            // TODO
        } else if (value instanceof Date) {
            return `${this.getQueryFieldString(field)} = ${this.getQueryValueString(value.toISOString())}`;
        } else {
            if (field != null && typeof value != 'object') {
                switch (typeof value) {
                    case 'string': { return `${this.getQueryFieldString(field)} = ${this.getQueryValueString(value)}`; }
                    case 'number': { return `${this.getQueryFieldString(field)} = ${this.getQueryValueString(value)}`; }
                    case 'boolean': { return `${this.getQueryFieldString(field)} = ${this.getQueryValueString(value)}`; }
                    default: { return `${this.getQueryFieldString(field)} = ${this.getQueryValueString(value)}`; }
                }
            }
        }
        return field;
    }
    
    public toQueryBody(obj, alias?: string): string {
        let query: string = '';
        
        for (let field of Object.keys(obj)) {
            if (field && obj[field] !== undefined) {
                let displayField = alias ? `${alias}.${field}` : field;
                if (obj[field] instanceof Array) {
                    for (let element of obj[field]) {
                        for (let innerField of Object.keys(element)) {
                            if (innerField && element[innerField] !== undefined && typeof element[innerField] != 'object') {
                                query += (query == '') ? 'WHERE ' : ' OR ';
                                query += `${this.toQueryConditionFormat(displayField, element[innerField])}`;
                            }   
                        }
                    }
                } else if (typeof obj[field] != 'object') {
                    query += (query == '') ? 'WHERE ' : ' AND ';
                    query += `${this.toQueryConditionFormat(displayField, obj[field])}`;
                }
            }
        }
        return query;
    }

    public toUpdateBody(obj): string {
        let query: string = '';
        for (let field of Object.keys(obj)) {
            if (field && obj[field] !== undefined && field != 'id' && typeof obj[field] != 'object') {
                query += (query == '') 
                    ? `${this.getQueryFieldString(field)} = ${this.getQueryValueString(obj[field])}` 
                    : `, ${this.getQueryFieldString(field)} = ${this.getQueryValueString(obj[field])}`;
            }
        }
        return query;
    }

    public toFieldsList(obj): string {
        let fields: string = '';
        for (let field of Object.keys(obj)) {
            if (field && obj[field] !== undefined && field != 'id' && typeof obj[field] != 'object') {
                fields += (fields == '') ? `${this.getQueryFieldString(field)}` : `, ${this.getQueryFieldString(field)}`;
            }
        }
        return fields;
    }

    public toValuesList(obj): string {
        let values: string = '';
        for (let field of Object.keys(obj)) {
            if (field && obj[field] !== undefined && field != 'id' && typeof obj[field] != 'object') {
                values += (values == '') ? `${this.getQueryValueString(obj[field])}` : `, ${this.getQueryValueString(obj[field])}`;
            }
        }
        return values;
    }

    public toCompostQuery(obj, alias?: any, startup?: string): string {
        let query: string = '';
        for (let field of Object.keys(obj)) {
            if (field && obj[field] !== undefined) {
                let displayField = alias ? `${alias}.${field}` : field;
                if (obj[field] instanceof GenericOption) {
                    query += (query == '') ? (startup ? startup : 'WHERE ') : ' AND ';
                    query += `${this.toQueryConditionFormat(displayField, obj[field].getValue())}`;
                } else if (obj[field] instanceof Array && obj[field].length > 0) {
                    if(obj[field][0] == 'between') {
                        query += (query == '') ? (startup ? startup : 'WHERE ') : ' AND ';
                        query += this.toQueryConditionFormatBetween(displayField, obj[field]);
                    } else {
                        query += (query == '') ? (startup ? startup : 'WHERE ') : ' AND ';
                        query += this.toQueryConditionFormatIn(displayField, obj[field]);
                    }
                } else if (typeof obj[field] != 'object' || obj[field] instanceof Date) {
                    query += (query == '') ? (startup ? startup : 'WHERE ') : ' AND ';
                    query += `${this.toQueryConditionFormat(displayField, obj[field])}`;
                }
            }
        }
        return query;
    }

    public toQueryConditionFormatNotIn(field: string, value: any) {
        if (value instanceof Array) {
            if(value[0] == 'in') {
                return `${this.getQueryFieldString(field)} NOT IN (${this.getQueryValueString(value.slice(1, value.length))})`;
            } else {
                return `${this.getQueryFieldString(field)} NOT IN (${this.getQueryValueString(value)})`;
            }
        }
        return field;
    }

    public toQueryConditionFormatIn(field: string, value: any) {
        if (value instanceof Array) {
            if(value[0] == 'in') {
                return `${this.getQueryFieldString(field)} IN (${this.getQueryValueString(value.slice(1, value.length))})`;
            } else {
                return `${this.getQueryFieldString(field)} IN (${this.getQueryValueString(value)})`;
            }
        }
        return field;
    }

    public toQueryConditionFormatBetween(field: string, value: any) {
        if (value instanceof Array) {
            if(value[0] == 'between') {
                if(value[1] != '' && value[2] != '') {
                    return `${this.getQueryFieldString(field)} BETWEEN ${this.getQueryValueString(value[1])} AND ${this.getQueryValueString(value[2])}`;
                }
                if(value[1] != '' && value[2] == '') {
                    return `${this.getQueryFieldString(field)} >= ${this.getQueryValueString(value[1])}`;
                }
                if(value[1] == '' && value[2] != '') {
                    return `${this.getQueryFieldString(field)} <= ${this.getQueryValueString(value[2])}`;
                }
            }
        }
        return field;
    }
}