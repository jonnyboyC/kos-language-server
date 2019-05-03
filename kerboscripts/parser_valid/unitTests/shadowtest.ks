// This file check that vscode correctly finds the shadowed variable
local a is 0.  

if true {
    local a is 0.
    print(a).
}

print(a).