set x to 10.
until x < 0 {
    set x to x - 1.

    if x = 3 {
        break.
    }
}

break.

function example {
    parameter a.

    for i in a {
        if i = "item" {
            break.
        }
    }
}

break.

from { local y to 0. } until y > 10 step { set y to y + 1. } do {
    print(y).

    if y > 20 {
        break.
    }
}