# Workspace Configuration with **ksconfig.json**

lilThe kos-language-server as of 0.13.0 now supports a workspace level configuration file `ksconfig.json`. This file describes the following configurations

|Name|Description|
|--|--|
|archive|The location relative to this `ksconfig.json` that corresponds to the archive directory}
|bodies|A list of custom bodies for the language server to consider valid. By default the normal KSP bodies are assumed|
|linting|A collection of rules and levels indicating what level lints should be reported|

# Archive

The location of the archive directory

## Example
This `ksconfig.json` will set the server to assume a directory scripts relative to the config correspondes to `0:/`

```json
{
  "archive": "scripts"
}
```

# Bodies

A list of custom bodies to consider valid

## Example
This `ksconfig.json` will set "Earth", "Moon" and "Mars" as the only valid bodies

```json
{
  "bodies": ["Earth", "Moon", "Mars"]
}
```

# Linting
This section is used to control the level linting rules are reported. Some rules correspond to a collection of child rules. All rules can be set to the max level `"error"` or the lowest level `"off"`.

## Example

```json
{
  "linting": {
    "symbols-strict": "hint",
    "invalid-break": "error",
    "parsing": "off",
  }
}
```

This will set all symbol lints to the hint level and and invalid break to error, and parsing errors off.

## Available Levels
1. `"error"`
1. `"warning"`
1. `"info"`
1. `"hint"`
1. `"off"`

## Available Rules

### **All**:

This rule is the global sets all other rules. Typically the use case would be to turn off all rules.

### **Misc**

These rules are not part of a grouping other than `all` and represent an assortment of lints.

|Name|Description|Default Level|
|--|--|--|
|scanner|This provides an error when an invalid token is encountered such as `variable$$$`|error|
|parser|This provides an error when invalid syntax is encounted such as `set x to .`|error|
|file-loading|This provides an error when the file cannot in a run statement|error|
|unreachable-code|This provides an error when code is unreachable. This typically occurs when a statement occurs after a break or return|error|
|no-global-parameters|This provides an error when `global parameter example.` is used as globals will throw in kOS|error|
|uninitialized-set|This is a warning when an undeclared variable is set with `@lazyglobal off`|warning|

### **Control Flow**
The `control-flow` grouping contains rules related to control flow in your script. Below are the fules related to `control-flow`

|Name|Description|Default Level|
|--|--|--|
|control-flow-break|This provides an error when a break appears outside of a loop body|error|
|control-flow-return|This provides an error when a return appears outside of a function body or trigger|error|
|control-flow-preserve|This provides an error when preserve appears outside of a trigger body|error|
|control-flow-lazy-global|This provides an error when a lazy global does appear at the top of a script|error|

### **Deprecated**

The `deprecated` grouping contains rules related to deprecated functionality. This include deprecated statements listed below

|Name|Description|Default Level|
|--|--|--|
|deprecated-delete|This provides a warning that the `delete` statement is deprecated|info|
|deprecated-copy|This provides a warning that the `copy` statement is deprecated|info|
|deprecated-rename|This provides a warning that the `rename` statement is deprecated|info|

### **Symbols-Strict**

The `symbols-strict` grouping contains rules related to symbols. This includes unused, undeclared, or shadowed symbols. Below are all child rules of `symbols-strict`.

|Name|Description|Default Level|
|--|--|--|
|symbol-may-not-exist|This applies to symbols that cannot be found. The language server is imperfect cannot determine symbols from dynamic run statements such as `runOnce(someExpression).`|warning|
|symbol-may-not-exist-closure|This applies to symbols that the server cannot determine are defined before a function body or trigger is executed the first time.|warning|
|symbol-wrong-kind|This is applied to situations where a lock is expected but a variable or function is provided|warning|
|symbol-unused|This applies to situations where a local variable is declared but not used|warning|
|symbol-unused-locally|This applies to global variables that are not used locally. This is for locks and variables that are declared global but not used in there file. There are cases where the this may occur such as global constants, but the server cannot track global usage|warning|
|symbol-shadowing|This applies to cases were a symbol is redeclared in an inner scope. This is not an error but can lead to logic bugs where the outer symbol is expected|warning|
|symbol-conflict|This applies to cases were a symbol is redeclared in the same scope. This is an error in kOS|warning|

### **Type-Checking**

The `type-checking` grouping are rules related to types in kerboscript. This includes unused, undeclared, or shadowed symbols. Below are all child rules of `type-checking`. Note. most of the rules for the type checker are at the hint level as the overall confidence in it's accuracy is somewhat low.


|Name|Description|Default Level|
|--|--|--|
|type-wrong|This applies to situations where the type checker determines the wrong type|hint|
|type-no-call|This applies to situations where the type checker determined the given type does not have a call signature|hint|
|type-wrong-arity|This applies to situations where a function or delegate is called with the wrong number of arguments|hint|
|type-list-invalid|This applies to the list command when an invalid list string is given|warning|
|type-no-indexer|This applies to situations where the type checker determined the given type does not have an indexer|hint|
|type-not-function|This applies to situations where a delgate is created from something other than a function|hint|
|type-missing-suffix|This applies to situation where the type checker determines a given type does not have a given suffix|hint|
|type-missing-operator|This applies to situations where the type checker determines a given type does not have the request binary or unary operator|hint|
|type-no-setter|This applies to situation where the type checker determines a given type cannot be set|hint|


