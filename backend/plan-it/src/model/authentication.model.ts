
export class Authentication {
    private id: number;
    private user_id: number;
    private hash: string;
    private salt: string;

    setId(id): void {
        if (id == undefined) {
            this.id = id;
        } else {
            if (isNaN(id)){
                throw 'field <id> from <authentication> object must be numeric';
            }        
            this.id = +id;
        }
    }       

    getId(): number {
        return this.id;
    }

    setHash(hash): void {
        this.hash = hash;
    }

    getHash(): string {
        return this.hash;
    }

    setSalt(salt): void {
        this.salt = salt;
    }

    getSalt(): string {
        return this.salt;
    }

    setUserId(user_id): void {
        if (user_id == undefined) {
            this.user_id = user_id;
        } else {
            if (isNaN(user_id)){
                throw 'field <user_id> from <authentication> object must be numeric';
            }        
            this.user_id = +user_id;
        }
    }       

    getUserId(): number {
        return this.user_id;
    }

    clone(clone): void {
        this.setId(clone.id);
        this.setUserId(clone.user_id);
        this.setHash(clone.hash);
        this.setSalt(clone.salt);
    }
    
    public validPostData() {
        if (this.getId() && this.getId() !== 0){
            throw new Error('field <id> from <authentication> object must be 0 or null');
        }
        this.validateNotNullFields();
    }

    public validPutData() {
        if (!this.getId()){
            throw new Error('field <id> from <authentication> cannot be null');
        }
        this.validateNotNullFields();        
    }

    public validDeleteData() {
        if (!this.getId()){
            throw new Error('field <id> from <authentication> cannot be null');
        }
    }

    private validateNotNullFields() {
        if (!this.getHash()) {
            throw new Error('field <hash> from <authentication> cannot be null');
        }
        if (!this.getSalt()) {
            throw new Error('field <salt> from <authentication> cannot be null');
        }
        if (!this.getUserId()) {
            throw new Error('field <user_id> from <authentication> cannot be null');
        }
    }
}