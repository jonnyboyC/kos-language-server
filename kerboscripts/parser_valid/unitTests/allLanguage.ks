@lazyGlobal on.

// triggers
on ship:body {
    print(10 ^ (5 * 3e-1)).
}

when 10 <> 5 then {
    copy "something" to "somewhere".
    rename file somewhere "blah" to "otherwhere".
    delete 10 from "someplace".
    switch to 0.
    compile body to 10.
    preserve.
}

toggle ship:panels.

// function
local function func {
    parameter a.
    parameter c is "something", b is 10.

    declare global x is 1e6 * 3.

    // all control flow
    if "string" = "string" {
        print((10 + 3)).
    } else {
        unset x.
    }

    local l is list(1, 2, 3, 4).
    from { local shp is ship. } until defined ship step { . } do {
        if shp <> ship and 10 <= 2 {
            break.
        }

        // indexers
        print l[0] at (10 + 5, (unchar(10))).
        print l#0.
    }

    for i in l {
        run once example.ks.
        runPath(i).
        runOncePath(x).
    }

    until a <> true {
        local lambda is { return func:bind(10, b, c). }.
        lambda().
    }

    wait until body:mu > 10.

    return 20.
}

declare global lock other to 10.

if "something":someMethod((10:typestring + "cat")) or false {
    print(other).
    unlock other.
}

log choose 10 if body:atm:exists else 5 to dump.txt.

stage.
clearScreen.
reboot.
shutdown.

local n is node(1, 1, 1, 1).
add n.
remove n.