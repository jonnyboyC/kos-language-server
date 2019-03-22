## [0.3.1] (2019-3-22)

## Features
- **default KSP planets** Added kerbin, eve, etc. to auto completes. Will eventually allow for customization
- **deprecated warning** Initial set of deprecated warning for deprecated io. i.e. copy, rename, delete instructions.

## Bug Fixes
- **run instruction resolution** fixed a bug the run instruction and functions where `runPath("0:example.ks").` did not resolve the sample as 
`runPath("0:\runpath.ks").` or `runPath("runpath.ks")`


## [0.3.0] (2019-3-7)

### Features
- **on hover type hints** Added support for on hover
- **better auto complete** completions now include type inferred type information where available

### Bug Fixes
- **rename instruction grammer** Fixed an issue with the grammar for the rename instruction
- **update performance diagnostics** Between the release of 0.2.0 and 0.3.0 vscode now ships with node 10. The performance hooks that were previously used have been remove. The new node performance hooks have been added in it's place
- **report error when lazyglobal off set** The language server now reports and errors when `lazyGlobal off. ... set x to "example".`
- **run instructions** Fixed a few issues related to the language server loading other file based on `runPath("example.ks").` and it's sibilings

## [0.2.0] (2019-1-5)

### Features
- **goto definition** Added support for Goto definition or variables, parameters, locks, and functions
- **auto complete** Added initial set of suggestions for auto complete. These included keywords as well as variables, functions etc that are detected in scope
- **find unused variable** Indicate variables that where declared but may not used
- **find unitialized variable** Indicate when a variable is used that may not exist
- **find file symbols** Using `CTRL + SHIFT + O` 

### Bug Fixes
- **number parsing** Fixed an issue when a number followed by a variable e would be interpreted as a number
- **parser** Fixed an issue where sometimes variable, parameter, lock or function declarations were not property parsed
- **defined keyword** Previously defined keyword was not correctly identified as one
- **node commands** Previously node commands were not highlighed correctly


## [0.1.3] (2018-12-1)

### Bug Fixes
- **parameter parsing**: Fixed and issue with parameter parsing where default parameters follow a normal parameter wouldn't work correctly.
- **updated vscode dependencies**: Precautionary update vscode depdencies to deal with the event-stream vunderability

## [0.1.2] (2018-09-17)

### Bug Fixes
- **break instruction**: Forgot to actually implement break statement logic
- **parameter syntax**: Previously comments would not highlight correctly in the middle of a parameter declaration
- **declare syntax**: Previously in `declare variable to thing.` the variable name was highlighted as a keyword.
- **more synchronize** instruction*: More keywords were reset error reporting

## [0.1.1] (2018-09-12)

### Bug Fixes
- **parse errors**: Previously there was a bug were parse errors were not correctly reported for instructions inside a block (for, until, function, etc.).

