
export class User {
    private id: number;
    private name: string;
    private email: string;

    setId(id): void {
        if (id == undefined) {
            this.id = id;
        } else {
            if (isNaN(id)){
                throw 'field <id> from <user> object must be numeric';
            }        
            this.id = +id;
        }
    }       

    getId(): number {
        return this.id;
    }

    setEmail(email): void {
        this.email = email;
    }

    getEmail(): string {
        return this.email;
    }

    setName(name): void {
        this.name = name;
    }

    getName(): string {
        return this.name;
    }

    clone(clone): void {
        this.setId(clone.id);
        this.setEmail(clone.email);
        this.setName(clone.name);
    }
    
    public validPostData() {
        if (this.getId() && this.getId() !== 0){
            throw new Error('field <id> from <user> object must be 0 or null');
        }
        this.validateNotNullFields();
    }

    public validPutData() {
        if (!this.getId()){
            throw new Error('field <id> from <user> cannot be null');
        }
        this.validateNotNullFields();        
    }

    public validDeleteData() {
        if (!this.getId()){
            throw new Error('field <id> from <user> cannot be null');
        }
    }

    private validateNotNullFields() {
        if (!this.getEmail()) {
            throw new Error('field <email> from <user> cannot be null');
        }
        if (!this.getName()) {
            throw new Error('field <name> from <user> cannot be null');
        }
    }
}

