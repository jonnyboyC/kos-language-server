import { StmtInterface } from "./types";

export class Stmt implements StmtInterface {
    get tag(): 'stmt' {
        return 'stmt';
    }
}