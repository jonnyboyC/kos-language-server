/// <reference types="node" />
import { AutoLanguageClient, ConnectionType } from 'atom-languageclient';
export declare class CSharpLanguageClient extends AutoLanguageClient {
    getGrammarScopes(): string[];
    getLanguageName(): string;
    getServerName(): string;
    getConnectionType(): ConnectionType;
    startServerProcess(): import("child_process").ChildProcess;
}
