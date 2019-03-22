"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atom_languageclient_1 = require("atom-languageclient");
const path_1 = require("path");
const fs_1 = require("fs");
class KosLanguageClient extends atom_languageclient_1.AutoLanguageClient {
    getGrammarScopes() { return ['source.kos']; }
    getLanguageName() { return 'Kerbal Operating System'; }
    getServerName() { return 'kos-language-server'; }
    getConnectionType() { return 'ipc'; }
    // startServerProcess(): LanguageServerProcess {
    //   // return super.spawnChildNode(
    //   //   [atom.config.get('language-kos.kosServer.path'), '--node-ipc'],
    //   //   { stdio: [null, null, null, 'ipc'] },
    //   // );
    // }
    shouldStartForEditor(editor) {
        if (!this.validateKosServerPath())
            return false;
        return super.shouldStartForEditor(editor);
    }
    validateKosServerPath() {
        const kosSpecifiedPath = atom.config.get('language-kos.kosServer.path');
        const isAbsolutelySpecified = path_1.isAbsolute(kosSpecifiedPath);
        const kosAbsolutePath = isAbsolutelySpecified
            ? kosSpecifiedPath
            : path_1.join(__dirname, '..', kosSpecifiedPath);
        if (fs_1.existsSync(kosAbsolutePath))
            return true;
        atom.notifications.addError('language-kos could not locate the kos-language-server', {
            dismissable: true,
            buttons: [
                { text: 'Set KOS server path', onDidClick: () => this.openPackageSettings() },
            ],
            description: `No KOS server could be found at <b>${kosAbsolutePath}</b>`,
        });
        return false;
    }
    openPackageSettings() {
        atom.workspace.open('atom://config/packages/language-kos');
    }
}
exports.KosLanguageClient = KosLanguageClient;
//# sourceMappingURL=main.js.map