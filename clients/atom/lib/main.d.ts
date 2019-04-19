import { TextEditor } from 'atom';
import { AutoLanguageClient, ConnectionType, LanguageServerProcess } from 'atom-languageclient';
export declare class KosLanguageClient extends AutoLanguageClient {
    getGrammarScopes(): string[];
    getLanguageName(): string;
    getServerName(): string;
    getConnectionType(): ConnectionType;
    startServerProcess(): LanguageServerProcess;
    shouldStartForEditor(editor: TextEditor): boolean;
    validateKosServerPath(): boolean;
    openPackageSettings(): void;
}
