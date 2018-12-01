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

