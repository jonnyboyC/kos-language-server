# KOS Language Server

kos-language-server is a language server for the Kerbal Operating System

Currently the kos-language-server 0.3.1 implements the follow features
- Code completion for KSP global scope suffixs and keywords. Additional suggests local variables that are in scope of the cursor.
- Document Symbols for quick navigation to properties in the document.
- Diagnostics (Validation) are pushed for all open documents
  - syntax errors
  - scemantic errors and warnings such as invalid parameter order, lazy global position, unused variables
- Go to definition for each symbol in the open documents. In some case can resolve functions in other scripts that have been run.
- On hover with experimentail type inference support