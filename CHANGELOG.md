# [1.1.2] (2020-3-3)

# Bug Fixes
- **Folding Region on Parenthesis** Previously the language server did not consider `(` `)` as a foldable region. after observing declarations with `list` and `lex` as followings.

```
local l1 is list(
    1,
    2,
    3,
)

local l2 is lex(
    "1", 1,
    "2", 2,
    "3", 3,
)
```

- **Print statement error issue** Because kos has a `print` statement as well as a `print` function there was special logic to go the call route if a `(` was encountered. This caused issues when really the statement was of the form.

```
print (1 + 2) + "cat".
```

Here this is actually a print statement with a grouping and a binary plus. previously it would consider this the function. Instead this special case is now removed and all print tokens are given the `print` functions type signature.

# [1.1.0] (2020-1-18)
# Features
- **Workspace Symbol Search** Symbols can now be searched in the whole workspace. On VsCode int the command palette using `#SymbolToSearch` will return a list of possible match.

# Bug Fixes
- **Symbol References** Previously the language server did not correctly respect the include declaration parameter. This now works as intended.

## Other
- **New Symbol Service** Symbol related request have been moved to their own service. Primarily this just facilitates easier testing separation of concerns.

# [1.0.1] (2020-1-3)
# Bug Fixes
The the version command `kls --version` or `kls -v` should now always determine the correct version to report. The server will now read it's own package json to it is reporting the correct semver.

# [1.0.0] (2019-12-27)
# Features
- **Symbol Hierarchy** In Vscode symbols are now displayed in a proper hierarchy. This change has the language server reporting the whole declaration as the symbol instead of just the identifier.

# Bug Fixes
- **Fix Output Window** Previously, under conditions where edits would occur in rapid succession sometime the output window would be focused. This typically occurred when undo was held down trigger many successive edits. This in some cases caused problems where edits would overlap. A more conservative approach now address this with potential minor performance regressions.
- **Less False Positives in Type Checker** The type checker would previous indicate many warning relating to the `structure` type. This is the base type typically encountered as parameters as they are currently untyped. Previously the language server would indicate bugs that `structure` did not have a call signature or an indexer, which while possible was not certain. The server now takes a more conservative approach and does not report these as bugs for the `structure` type
- **Function arity diagnostics** The type checker now correctly handles optionally parameters. The below example illustrates what is now correctly accepted

    ```
    function example {
        parameter a, b is 10. // one required and optional parameter
        // ...
    }

    example().         // error
    example(5).        // ok
    example(5, 20).    // ok
    example(5, 20, 4). // error
    ```
- **Rename and Find All References** Previously, the server did not count locations where symbols were set in rename or find all references. They are now correctly included.

## Other
- **Improved Typechecking Performance** This will only matter in very large files but type checking has seen a 20-30% improvement in performance
- **Benchmarking** New benchmark framework `zakzak` uses as a benchmark suite.

# [0.14.0] (2019-12-17)
## Features
- **#include directive** A new comment directive has been added that allows files to be treated as if run. Under certain scenarios kos-language-server cannot determine that a file has been run typically through dynamic run statements. This allows autocomplete of file that will or likely will be run in these situations. An example shows an `#include` working similar to a run statement

    ```
    // #include "0://somepath.ks"
    runOncePath("0://somepath.ks"). // these two lines are functionally identical
    ```

## Bug Fixes
- **Npm Package**: Fixes a bug in the standalone `kls` global node tool where the server would not start.

# [0.13.0] (2019-11-27)
## Features
- **Workspace configuration** The kos-language-server now recognizes a new workspace configuration file `ksconfig.json`. An example is shown below

    ```json
    {
        "archive": "src",
        "bodies": ["earth", "moon"],
        "linting": {
            "unreachable-code": "off" 
        }
    }
    ```

This configuration sets `0:/` to correspond to the `/src` folder for the language server. The bodies considered valid are now the earth and moon. Finally the unreachable code diagnostics are turned off. See more details and documentation [here](https://github.com/jonnyboyC/kos-language-server/tree/master/server/ksconfig.md).

# [0.12.1] (2019-11-6)
## Features
- **Diagnostics Names** Diagnostics now have consistent names throughout the language server so they can more easily be searched.
- **kOS 1.2.0 Types** The type definition have been updated to include the functions and suffixes added int he kOS 1.2.0 update 

## Bug Fixes
- **Shadow / Conflict Related Info** Previously the language server would incorrectly report that the location of a definition shadow or conflict was in the same file as the error occurred. This has been updated so global symbols are correctly reported.
- **Gui Types** Fixed an issue with the GUI types where completions on GUI types would sometimes cause the server to throw.


# [0.12.0] (2019-10-8)

## Features
- **Workspace Loading** The language server can now eagerly load the whole workspace, providing diagnostics for all files in the folder
- **Change Propagation** The server can now better propagate changes from one file to another that is dependent based on a run statement

# [0.11.0] (2019-8-30)

## Bug Fixes
- **Path type declaration fixed** This is a minor type declaration fix to the `path()` function the type definition has been updated to `path: ((string or path)?) => path` indicates that a path can be constructed from a string, a path, or nothing. 

## Features
- **Control Flow Analysis** The language server can now find cases of unreachable code. Two simples examples are below.

    ```
    for i in range(3) {
        break.
        print(i) // <- now indicates this is unreachable
    }

    function example {
        parameter x.

        if x < 3 {
            return true.
            print("Less than 3") // <- now indicates this is unreachable
        }

        return false
    }
    ```


# [0.10.1] (2019-8-30)

## Bug Fixes
- **Manual Auto Complete Trigger** Previously the auto complete required a trigger character of `:` for suffix completions. This was not idea if the user manually triggered auto complete or was editing a suffix in the middle of some suffix chain. Auto complete no longer requires the trigger character to more frequently correctly identify a suffix context.

## Features
- **Search Documentation** Documentation can more directly be searched in the vscode extension. Using the command palette with `cntr + shift + p` search `kOS Search Documentation` and type in the search term. This will open your default web browser to the kos documentation with your search in place. Search can also be used via the right click context menu.
- **Improved Type System** The type system can no handle some cases of type coercion where one type is converted to another. Some typical examples are converting structures to strings, or converting vectors into directions. Additional the type check better understands collections. As an example

    ```
    local p is path("example/file.ks").

    // instead of structure first segment is now a string
    local firstSegment is p:segments[0]
    for segment in p:segments {

        // is also aware segment is a string
        print(segment)
    }
    ```

# [0.9.1] (2019-7-24)

## Bug Fixes
- **Disable Type Checking Diagnostics** Reverted type checking diagnostics to not display

# [0.9.0] (2019-7-24)

## Features
- **Boot Directory** The boot directory now correctly resolves to the base of volume0
- **Run Statement Go to Definition** Run statements now support go to definition in addition to symbols. This will open the file that kos-language server has resolve your run statement to. If the file is found it will go to. If a file extension is omitted kos-language server will attempt to look for a file with the `.ks` extension.

## Bug Fixes
- **Globals** Global variables better reflect kOS with the following more actually being represented.

      // main.ks
      runPath("lib.ks").
      global hi is "hi".
      greet().

      // lib.ks
      function greet {
        print(hi)
      }  //   ^---- know of hi in main.ks

# [0.8.2] (2019-7-13)

## Bug Fixes
- **Folding Region** The addition of `// #region` to the language server override vscode default folding behavior. This replicates the default folding behavior inside of the language server.

# [0.8.1] (2019-7-12)

## Bug Fixes
- **Log Exception Fix** There was a bug in the exception logging code causing another exception to be throw. This fix resolves this issue.

# [0.8.0] (2019-7-12)

## Features
- **Preserve Diagnostic** report a new error when the preserve keyword appears outside of a trigger scope. Previously preserve wouldn't trigger any warning when it appeared in an inappropriate place

- **Improved Operator Type Checking** The internal type checker has been improved to better represent operators inside of kerboscript.

- **Folding Region** The language server now supports folding regions. The server will now recognize the following a a foldable region.
      
    ```
    // #region
    print("this region").
    print("can fold").
    // #endregion
    ```

## Bug Fixes
- **Trigger Return** Previously it returns were reported as error when they appeared inside of a trigger body. The return statement can be used as a more dynamic form of preserve when inside a trigger. It determines when trigger should remain active after its current execution.


# [0.7.2] (2019-7-7)

## Bug Fixes
- **Error for Empty Files** A bug was introduced as part of the code reorganization that caused an exception to be throw with empty files. This included blank files and files with only whitespace or comment. 

# [0.7.1] (2019-7-4)

## Bug Fixes
- **Marketplace README** Previously in the bundle the README.md was accidentally ignored causing the marketplace page to appear blank.

# [0.7.0] (2019-7-4)

## Features
- **Choose Syntax** Added the new choose syntax to the server. Both syntax highlighting and semantic rules have been added.

## Other
- **Document Service** Major refactor to begin splitting some of the server level functionality into difference services. A new document server has been added to handle.


# [0.6.2] (2019-6-15)

## Features
- **Better server experience** Added a new interface for calling, the language server from the command line. This also updates the build process so both type compile and bundled version of the code are produced.

# [0.6.1] (2019-6-5)

## Features
- **Rename Symbol** The language server name supports the rename handler. The server can now rename all instances of a symbol it is aware of.

## Bug Fixes
- **Suffix Type Names** Previously some suffixes would be completed as `example<anotherExample>`. This was an error in the internal type system. This should not longer occur
- **Identifer Led Statements** Previously auto complete for suffixes would not trigger some anything like the following. This has now be fixed.

    ```
    local l is list().
    l: // <- previously this wouldn't trigger for list suffixes
    ```


# [0.6.0] (2019-5-30)

## Features
- **Suffix Completion** In addition to completion suggestions for variables, locks, and function, suffixes are suggested when the type is known. This should almost always be the case for common globals such as `ship` and `body`.
- **Signature Help** When the function can be determined signature help can now be provided. Currently the signature displays the types for each parameter but not the parameter name. In a feature release parameter name will be added.

## Bug Fixes
- **Type Hover** Previously, on hover would not work past the first suffix trailer. This version rewrites a large part of the type checker to better resolve types for suffixes. On hover now reports types for all depths of suffix. 

## Other
- **Instruction to Statement** changed all references of instruction to statement to better align with the terminology of Kos

# [0.5.1] (2019-5-16)

## Features
- **Code snippets** Many code snippets have been added for control flow, and declarations. Feel free to suggest more on the github issue tracker.
- **Minor List Hover improvement** In some limited cases we can identify the element of a list more specifically than structure. for example will identify that i is an int.

    ```
    for i in range(10) {
        print(i).
    }
    ```

## Bug Fixes
- **Return In Anonymous Functions** Previously, Anonymous functions were not correctly counted as a valid scope for returns and would mark as an error. This has been fixed and will no longer provide a false positive
- **Return Syntax Highlighting v2** syntax highlighting now **correctly** occurs correct for all forms of return. Previously `return.` used the wrong textmate form and would capture the remainder of the file. 
- **Default function scope logic** A bug was introduced that caused function declared at the script level to not default to global scope. This would cause library scripts to be run to not place these functions in global scope.

# [0.5.0] (2019-5-13)

## Features
- **Break and Return Diagnostics** The language server is now able to find breaks outside of loops and returns outside of functions. A diagnostics reports when these occur.
- **On Hover Improvements** Overall the on hover has been improved. The server now indicates the response is code can should be formatted as such. Additionally some symbols that previously wouldn't allow on hover now work as expected

## Bug Fixes
- **Return Syntax Highlighting** syntax highlighting now occurs correct for all forms of return. Previously only `return expression.` would highlight correctly but `return.` now highlights as well

## Other
- **Type Checker Performance** Some changes to how the type checker looks up symbols has results in a speed up for `5x - 10x`
- **Atom Client and Grammar Submodules** The atom client and the textmate grammar have successfully been moved to their own repos and included here as submodules

# [0.4.0] (2019-5-4)

## Features
- **New Settings** The following settings have been added
    - `kos-vscode.completionCase`: indicate completion casing more below.
    - `kos-vscode.trace.server.level`: this changes the level the the language server reports messages. This is primarily for extension development.

- **Code Completion Casing** The release has several improvements to code completion. The language server will not preserve the original casing of the author. For example previously is a variable was declared as `set Example to "example".` the server would provide completion as `example` instead of `Example` this has now been rectified. In addition keywords, and symbols from kos itself can now set a preferred casing with the new setting `kos-vscode.completionCase`.

    - `kos-vscode.completionCase` has the following options:
        - "lowercase" example: `examplevariable`
        - "uppercase" example: `EXAMPLEVARIABLE`
        - "camelcase" example: `exampleVariable`
        - "pascalcase" example: `ExampleVariable`

## Bug Fixes
- **Symbol may not exist in triggers / functions**: previously the follow would report a "symbol may not exist error".

    ```
    function example {
    print(b).
    }

    set b to 10.
    example().
    ```

  this now indicates via a hint that `b` may not be defined during the script run. Usages and go to definition should both now work in this situation.
- **true / false syntax**: previously the syntax highlighting would only highlight `true` or `false` if all lowercase. Now highlighting works for any casing of `TRUE` or `FALSE`. 


# [0.3.4] (2019-4-25)

## Bug Fixes
- **Logging** Provided a temporary work around to logging highlighting when server errors occur.

# [0.3.3] (2019-4-19)

## Features
- **variable shadow warning** A new warning was added that indicates when a variable, function, parameter or lock shadows another. In this case a line such as `local char is "x".` with now indicate that `char` shadows the built in function `char(scalar) => string"`.

## Bug Fixes
- **error reporting** Fixed an issue where errors reported on run'ed files would not correct line to the file

## Other
- **performance improvements** Some minor performance improvements in internal scanning / parsing
- **new log commands** Added new logging commands primarily for development.

# [0.3.2] (2019-3-30)

## Features
- **start ksp command** Added a new command to the vscode command pallette. This command will start kerbal space program. By default this extension will check the default steam install location. To specify a different path use.
    - **kos-vscode.kerbalSpaceProgramPath** New extension settings to indicate the path of the kerbal space program
- **connect telnet command** Added a new command to connect the platform telnet client to ksp. For mac users you will need to install telnet
    - **kos-vscode.telnetHost** New extension setting to indicate the address of the kOS telnet host
    - **kos-vscode.telnetPort** New extension setting to indicate the kOS telnet port

## Bug Fixes
- **vscode activation bug** fixed a bug where a dependency wasn't included in the published extension. This would prevent the extension from properly activating.

# [0.3.1] (2019-3-22)

## Features
- **default KSP planets** Added kerbin, eve, etc. to auto completes. Will eventually allow for customization
- **deprecated warning** Initial set of deprecated warning for deprecated io. i.e. copy, rename, delete statements.

## Bug Fixes
- **run statement resolution** fixed a bug the run statement and functions where `runPath("0:example.ks").` did not resolve the sample as 
`runPath("0:\runpath.ks").` or `runPath("runpath.ks")`


# [0.3.0] (2019-3-7)

## Features
- **on hover type hints** Added support for on hover
- **better auto complete** completions now include type inferred type information where available

## Bug Fixes
- **rename statement grammar** Fixed an issue with the grammar for the rename statement
- **update performance diagnostics** Between the release of 0.2.0 and 0.3.0 vscode now ships with node 10. The performance hooks that were previously used have been remove. The new node performance hooks have been added in it's place
- **report error when lazyglobal off set** The language server now reports and errors when `lazyGlobal off. ... set x to "example".`
- **run statements** Fixed a few issues related to the language server loading other file based on `runPath("example.ks").` and it's siblings

# [0.2.0] (2019-1-5)

## Features
- **goto definition** Added support for Goto definition or variables, parameters, locks, and functions
- **auto complete** Added initial set of suggestions for auto complete. These included keywords as well as variables, functions etc that are detected in scope
- **find unused variable** Indicate variables that where declared but may not used
- **find uninitialized variable** Indicate when a variable is used that may not exist
- **find file symbols** Using `CTRL + SHIFT + O` 

## Bug Fixes
- **number parsing** Fixed an issue when a number followed by a variable e would be interpreted as a number
- **parser** Fixed an issue where sometimes variable, parameter, lock or function declarations were not property parsed
- **defined keyword** Previously defined keyword was not correctly identified as one
- **node commands** Previously node commands were not highlighted correctly


# [0.1.3] (2018-12-1)

## Bug Fixes
- **parameter parsing**: Fixed and issue with parameter parsing where default parameters follow a normal parameter wouldn't work correctly.
- **updated vscode dependencies**: Precautionary update vscode dependencies to deal with the event-stream vulnerability

# [0.1.2] (2018-09-17)

## Bug Fixes
- **break statement**: Forgot to actually implement break statement logic
- **parameter syntax**: Previously comments would not highlight correctly in the middle of a parameter declaration
- **declare syntax**: Previously in `declare variable to thing.` the variable name was highlighted as a keyword.
- **more synchronize** statement*: More keywords were reset error reporting

# [0.1.1] (2018-09-12)

## Bug Fixes
- **parse errors**: Previously there was a bug were parse errors were not correctly reported for statements inside a block (for, until, function, etc.).

