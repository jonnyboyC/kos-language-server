import { TextEditor } from 'atom';
import { AutoLanguageClient, ConnectionType } from 'atom-languageclient';
export declare class KosLanguageClient extends AutoLanguageClient {
    getGrammarScopes(): string[];
    getLanguageName(): string;
    getServerName(): string;
    getConnectionType(): ConnectionType;
    shouldStartForEditor(editor: TextEditor): boolean;
    validateKosServerPath(): boolean;
    openPackageSettings(): void;
}
