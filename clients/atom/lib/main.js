"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atom_languageclient_1 = require("atom-languageclient");
class CSharpLanguageClient extends atom_languageclient_1.AutoLanguageClient {
    getGrammarScopes() { return ['source.kos']; }
    getLanguageName() { return 'Kerbal Operating System'; }
    getServerName() { return 'kos-language-server'; }
    getConnectionType() { return 'ipc'; }
    startServerProcess() {
        const server = require.resolve('kos-language-server/src/server');
        return super.spawnChildNode([server, '--node-ipc'], {
            stdio: [null, null, null, 'ipc'],
        });
    }
}
exports.CSharpLanguageClient = CSharpLanguageClient;
//# sourceMappingURL=main.js.map