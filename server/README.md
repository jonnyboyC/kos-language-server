# KOS Language Server

kos-language-server is a language server for the Kerboscript language, part of Kerbal Operating System mod.

## Installation
This package should like be installed globally using 

      npm install -g kos-language-server

the server can then be started by

      kls

## Arguments

- `-v` `--version`            output the version number
- `--node-ipc`                Connect with node inter process communication
- `--stdio`                   Connect with standard io
- `--clientProcessId`         Id of the attached client process
- `--harmony_async_iteration` Must be enabled if using node.js pre 10.0
- `-h` `--help`               output usage information


## Features
Currently the kos-language-server 0.10.1 implements the follow features
- Code completion
    - Built in symbols and keywords
    - local in scope symbols
    - suffixes where the type can be resolved
    - can be manually triggered
- Document Symbols for quick navigation to properties in the document.
- Diagnostics (Validation) are pushed for all open documents
  - syntax errors
  - semantic errors such as:
    - invalid parameter order
    - lazy global position
    - return and break outside of function or loop body
  - semantic warnings such as:
    - potentially undefined symbols
    - symbols that are shadowed by other symbols
    - potentially unused symbols
    - unreachable code
- Go to definition for symbols and run statements. Currently for clashing globals the first found will be shown
- Refactoring
  - Rename symbol
- Type Checking
  - prototype type checker
  - can in certain scenarios correctly identify the types of symbols and expressions
- On hover symbol information with type info
- Signature help for functions that can be correctly resolved
- Caching of all documents in the workspace
- Foldable regions using `\\#region` and `\\#endregion`