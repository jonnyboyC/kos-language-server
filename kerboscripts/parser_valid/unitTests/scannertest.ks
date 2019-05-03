// if file is used to check the scanner produces the correct
// set of tokens upon scanning the file
@lazyglobal on.
global function test {
    parameter a, b is 10.
    print(b).

    for i in a {
        print(i).
    }

    from { local x is 0. } until x > 10 step { set x to x + 1.5. } do {
        wait until x. // inline comment
    }
}

// comment
lock t to "example".

on t {
    stage.
    clearscreen.
    log body:target to "example.txt".
}
unlock t.

test(list(), 10).

sas off.
runpath("definedtest.ks").

reboot.
