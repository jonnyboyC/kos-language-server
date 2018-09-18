## [0.1.2] (2018-09-17)
### Bug Fixes
- **break instruction**: Forgot to actually implement break statement logic
- **parameter syntax**: Previously comments would not highlight correctly in the middle of a parameter declaration
- **more synchronize** instruction*: More keywords were reset error reporting

## [0.1.1] (2018-09-12)
### Bug Fixes
- **parse errors**: Previously there was a bug were parse errors were not correctly reported for instructions inside a block (for, until, function, etc.).