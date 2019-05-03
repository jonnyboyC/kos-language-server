// because variables used in functions and triggers can be defined
// after the trigger is defined we defer they're processing until afterwards

when 10 < c then {
    print(c).
}

on c {
    print(c).
}

local c is 10.

local function test {
    parameter a.

    print(a + b).
}

local b is 10.
test().