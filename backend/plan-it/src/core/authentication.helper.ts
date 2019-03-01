
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';

export class AuthenticationHelper {
    private static iterations = 10000;
    private static keylength = 32;
    private static digest = 'sha512';

    public static segurifyCredential(credential) {
        const salt = crypto.randomBytes(128).toString('base64');
        const hash = crypto.pbkdf2Sync(
            credential.toString(), 
            AuthenticationHelper.segurifySalt(salt), 
            AuthenticationHelper.iterations, 
            AuthenticationHelper.keylength, 
            AuthenticationHelper.digest
        ).toString('base64');
        return { salt, hash };
    }

    public static verifyCredential(attempt, hash, salt) {
        const attemptHash = crypto.pbkdf2Sync(
            attempt.toString(), 
            AuthenticationHelper.segurifySalt(salt), 
            AuthenticationHelper.iterations, 
            AuthenticationHelper.keylength, 
            AuthenticationHelper.digest
        ).toString('base64');
        return attemptHash === hash;
    };

    public static createToken(model) {
        let token = jwt.sign(
            { data: model },
            process.env.TOKEN_SECRET,
            { expiresIn: `${process.env.TOKEN_EXPIRE_MINUTES}m` }
        );
        return token;
    };

    public static omitProperties(obj: any, keys: any[]): any {
        var clone = {};
        for (let key of Object.keys(obj)) {
            if (keys.indexOf(key) == -1) {
                clone[key] = obj[key];
            }
        }
        return clone
    }

    private static segurifySalt(salt: string): string {
        return AuthenticationHelper.reverseString(salt);
    }

    private static reverseString(str) {
        return str.split("").reverse().join("");
    }
    
    public urlBase64Decode(str: string): string {
        let output = str.replace(/-/g, '+').replace(/_/g, '/');
        switch (output.length % 4) {
          case 0: {
            break;
          }
          case 2: {
            output += '==';
            break;
          }
          case 3: {
            output += '=';
            break;
          }
          default: {
            throw 'String base64url invalida!';
          }
        }
        return this.b64DecodeUnicode(output);
    }

    private b64decode(str: string): string {
        let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        let output: string = '';
    
        str = String(str).replace(/=+$/, '');
    
        if (str.length % 4 == 1) {
            throw new Error("Falha 'atob': A string a ser decodificada não foi codificada corretamente.");
        }
    
        for (
            // initialize result and counters
            let bc: number = 0, bs: any, buffer: any, idx: number = 0;
            // get next character
            buffer = str.charAt(idx++);
            // character found in table? initialize bit storage and add its ascii value;
            ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
            // and if not first of each 4 characters,
            // convert the first 8 bits to one ascii character
            bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
        ) {
            // try to find character in table (0-63, not found => -1)
            buffer = chars.indexOf(buffer);
        }
        return output;
    }

    // https://developer.mozilla.org/en/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#The_Unicode_Problem
    private b64DecodeUnicode(str: any) {
        return decodeURIComponent(Array.prototype.map.call(this.b64decode(str), (c: any) => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    }

    /**
     * this is used to decode our token if passed or pick it from the local storage
     * @param token
     */
    public decodeToken(token: string): any {
        if (token == null) {
            return null;
        }
        let parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error('JWT deve possuir 3 partes');
        }
        let decoded = this.urlBase64Decode(parts[1]);
        if (!decoded) {
            throw new Error('Não foi possível decodificar o token');
        }
        return JSON.parse(decoded);
    }
}
