
export class Environment {
    public readonly environment?: Environment;

    constructor(environment?: Environment) {
        this.environment = environment;
    }
}

const unitialized = {};