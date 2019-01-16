import { AutoLanguageClient, ConnectionType } from 'atom-languageclient';
import { isAbsolute, join } from 'path';
import { existsSync } from 'fs';

export class KosLanguageClient extends AutoLanguageClient {
  getGrammarScopes(): string[] { return ['source.kos']; }
  getLanguageName(): string { return 'Kerbal Operating System'; }
  getServerName(): string { return 'kos-language-server'; }
  getConnectionType(): ConnectionType { return 'ipc'; }

  startServerProcess() {
    return super.spawnChildNode(
      [atom.config.get('language-kos.kosServer.path'), '--node-ipc'],
      { stdio: [null, null, null, 'ipc'] },
    );
  }

  shouldStartForEditor(editor: TextEditor) {
    if (!this.validateKosServerPath()) return false;
    return super.shouldStartForEditor(editor);
  }

  validateKosServerPath(): boolean {
    const kosSpecifiedPath = atom.config.get('language-kos.kosServer.path');
    const isAbsolutelySpecified = isAbsolute(kosSpecifiedPath);
    const tsAbsolutePath = isAbsolutelySpecified
      ? kosSpecifiedPath
      : join(__dirname, '..', kosSpecifiedPath);

    if (existsSync(tsAbsolutePath)) return true;

    atom.notifications.addError('language-kos could not locate the kos-language-server', {
      dismissable: true,
      buttons: [
        { text: 'Set KOS server path', onDidClick: () => this.openPackageSettings() },
      ],
      description:
        `No KOS server could be found at <b>${tsAbsolutePath}</b>`,
    });

    return false;
  }
}
