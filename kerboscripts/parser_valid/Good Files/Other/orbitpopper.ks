print "running orbitpopper.ks".
PARAMETER direction.
PARAMETER Trot.
PARAMETER Targget.
PARAMETER ORB. // Y=NO TARGET BUT ORBIT N= TARGET IS TRUE

run stagechecker.
Stagecheck().
lock steering to heading(direction, 0).
wait 5.

IF eta:apoapsis > 300 {
	set kuniverse:timewarp:warp to 3.
	}

Wait until eta:apoapsis <= 180.
set kuniverse:timewarp:warp to 0.

wait until eta:apoapsis < 20.
Lock throttle to Trot.
run orbitstopper(direction, Targget, ORB).
