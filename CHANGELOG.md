## [0.2.0] (2019-1-3)
- **Goto Definition** Added support for Goto definition or variables, parameters, locks, and functions
- **Auto Complete** Added initial set of suggestions for auto complete. These included keywords as well as variables, functions etc that are detected in scope
- **Find Unused Variable** Indicate variables that where declared but may not used
- **Find Unitialized Variable** Indicate when a variable is used that may not exist

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

