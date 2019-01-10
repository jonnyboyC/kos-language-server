import { AutoLanguageClient, ConnectionType } from 'atom-languageclient';

export class CSharpLanguageClient extends AutoLanguageClient {
  getGrammarScopes(): string[] { return ['source.kos']; }
  getLanguageName(): string { return 'Kerbal Operating System'; }
  getServerName(): string { return 'kos-language-server'; }
  getConnectionType(): ConnectionType { return 'ipc'; }

  startServerProcess () {
    const server = require.resolve('kos-language-server/server');
    return super.spawnChildNode([server, '--node-ipc'], {
      stdio: [null, null, null, 'ipc'],
    });
  }
}
