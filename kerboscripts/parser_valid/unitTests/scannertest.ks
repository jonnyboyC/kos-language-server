@lazyglobal on.
global function test {
    parameter a, b is 10.

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

sas off.
runpath("definedtest.ks").

reboot.
