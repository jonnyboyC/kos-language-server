# KOS Language Server

kos-language-server is a language server for the Kerboscript language, part of Kerbal Operating System mod.

## Features
Currently the kos-language-server 0.6.0 implements the follow features
- Code completion
    - Built in symbols and keywords
    - local in scope symbols
    - suffixes where the type can be resolved
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
- Go to definition for each symbol in the open documents. In some case can resolve functions in other scripts that have been run.
- On hover with experimentail type inference support
- Signiture help for functions that can be correctly resolved