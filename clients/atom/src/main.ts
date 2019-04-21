import { TextEditor } from 'atom';
import { AutoLanguageClient, ConnectionType, LanguageServerProcess } from 'atom-languageclient';
import { isAbsolute, join } from 'path';
import { existsSync } from 'fs';

export class KosLanguageClient extends AutoLanguageClient {
  getGrammarScopes(): string[] { return ['source.kos']; }
  getLanguageName(): string { return 'Kerbal Operating System'; }
  getServerName(): string { return 'kos-language-server'; }
  getConnectionType(): ConnectionType { return 'ipc'; }

  startServerProcess(): LanguageServerProcess {
    console.log("start server process");

    return super.spawnChildNode(
      [atom.config.get('language-kos.kosServer.path'), '--node-ipc'],
      { stdio: [null, null, null, 'ipc'] },
    ) as LanguageServerProcess;
  }

  shouldStartForEditor(editor: TextEditor) {
    console.log("should start editor");

    if (!this.validateKosServerPath()) return false;
    return super.shouldStartForEditor(editor);
  }

  validateKosServerPath(): boolean {
    console.log("validate kos server path");

    const kosSpecifiedPath = atom.config.get('language-kos.kosServer.path');
    const isAbsolutelySpecified = isAbsolute(kosSpecifiedPath);
    const kosAbsolutePath = isAbsolutelySpecified
      ? kosSpecifiedPath
      : join(__dirname, '..', kosSpecifiedPath);

    if (existsSync(kosAbsolutePath)) return true;

    atom.notifications.addError('language-kos could not locate the kos-language-server', {
      dismissable: true,
      buttons: [
        { text: 'Set KOS server path', onDidClick: () => this.openPackageSettings() },
      ],
      description:
        `No KOS server could be found at <b>${kosAbsolutePath}</b>`,
    });

    return false;
  }

  openPackageSettings() {
    console.log("open package settings");

    atom.workspace.open('atom://config/packages/language-kos');
  }
}
