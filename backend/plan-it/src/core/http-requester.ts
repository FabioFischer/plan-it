
import axios from 'axios';

export class HttpRequester {

    public async request(options: HttpOptions) {
        try {
            let response = await axios(options);
            return new HttpResponse({statusCode: response.status, header: response.headers, data: response.data});            
        } catch (e) {
            throw e;
        }
    }
}

export class HttpOptions {   
    public method: string;
    public url: string;
    public headers: any;
    public data: any;

    constructor(params){
        this.method = params.method;
        this.url = params.url;
        this.headers = params.headers || {};
        this.data = params.data;
    }
}

export class HttpResponse {
    public statusCode: number;
    public header: any;
    public data: any;

    constructor(params){
        this.statusCode = params.statusCode;
        this.header = params.header;
        this.data = params.data;
    }
}
