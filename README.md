# kOS Language Server

[![Build Status](https://dev.azure.com/johnchabot2013/KOS-Language-Server/_apis/build/status/jonnyboyC.kos-language-server?branchName=master)](https://dev.azure.com/johnchabot2013/KOS-Language-Server/_build/latest?definitionId=1&branchName=master)
![Azure DevOps tests](https://img.shields.io/azure-devops/tests/johnchabot2013/KOS-Language-Server/1.svg)
![Azure DevOps coverage (branch)](https://img.shields.io/azure-devops/coverage/johnchabot2013/KOS-Language-Server/1/master.svg)

A language server for Kerboscript within the [KOS](https://github.com/KSP-KOS/KOS) mod for Kerbal Space Program. A [language server](https://langserver.org/) can provide features typical to an IDE language for the supported target language, in this case Kerboscript. 

The project currently supports the following clients
* [Visual Studio Code](https://code.visualstudio.com/) via the [kOS extension](https://marketplace.visualstudio.com/items?itemName=JohnChabot.kos-vscode)
* [Vim](https://www.vim.org/) via [kerbovim](https://github.com/Freedzone/kerbovim)
* [Atom](https://atom.io/) only with syntax highlight via the [kos-ide plugin](https://atom.io/packages/ide-kos) 

For additional client support such as sublime text, emacs, notepad++ or others please post an issue with the requested editor. 

<a href="https://imgur.com/kmrbdE4"><img src="https://i.imgur.com/kmrbdE4h.gif" title="source: imgur.com" /></a>

## Features

Currently the vscode client 0.12.0 implements the follow features
- syntax highlighting
- brace detection
- code snippets
- diagnostics on parsing errors
- go to definition and symbols and run statements
- symbol auto complete
- suffix auto complete
- manual completion triggering
- rename symbol
- unreachable code detection
- function signature help
- file symbol lookup
- identify symbols that don't exist
- identify unused symbols
- identify symbols that shadow (hide) an existing variable
- identify symbols that may not exist at runtime
- on hover type definitions (experimental)
- full workspace loading and change propagation
- foldable regions with `\\ #region` and `\\ #endregion`
- documentation searching

## Commands
All commands can be launched with `ctrl+shift+p`
- launch kerbal space program `kOS: Start Kerbal Space Program`
- launch telnet client using `kOS: Connect Telnet Client`
- Route server logging to LSP inspector `kOS: Route Logging to LSP inspector`
- Route server logging to Vscode `kOS: Route Logging to Vscode`
- Search kOS Documentation `kOS: Search Documentation`

## Workspace Configuration
The workspace can be configured with a file called `ksconfig.json`. The following is an example

```json
{
  "archive": "..",
  "bodies": ["earth", "moon", "sun"],
  "linting": {
    "control-flow-break": "off"
  }
}
```

This will set the archive folder to correspond to the folder above, the valid bodes to be `earth`, `moon` and `sun` and to turn off linting related to invalid break statements. More info can be found [here](https://github.com/jonnyboyC/kos-language-server/tree/master/server/ksconfig.md).

## Global Configuration
These settings are currently included with the tool
- `kos-vscode.kerbalSpaceProgramPath` Path to kerbal space program
- `kos-vscode.completionCase` Indicate the preferred completion case for built in symbols
- `kos-vscode.telnetHost` Host name of the telnet server
- `kos-vscode.telnetPort` Host port of the telnet server
- `kos-vscode.lspPort` Port to send lsp message to for the [LSP Inspector](https://marketplace.visualstudio.com/items?itemName=octref.lsp-inspector-webview)
- `kos-vscode.trace.server`
  - `verbosity` Detail level of the logs
  - `format` Log format
  - `level` Message level

## Influence
This project is heavily inspired by the [crafting interpreters](http://craftinginterpreters.com/) series. Definitely check it out if your interested in creating your own language, or language tooling.
