print "running orbitstopper.ks".
PARAMETER direction.
PARAMETER targget.
PARAMETER ORB. // Y=NO TARGET BUT ORBIT N= TARGET IS TRUE
run stagechecker.
stagecheck().
set oldap to APOAPSIS.
wait until eta:apoapsis>50 OR Periapsis>oldap.
lock throttle to 0.
if eta:apoapsis>600{
	lock throttle to 1.
	wait until periapsis>oldap.
	lock throttle to 0.
}

If (APOAPSIS-PERIAPSIS)>5000{
	Run orbitpopper(direction, 0.2, Targget).
	}ELSE{
		run launch(Targget, N, ORB).
//		run orbitinstructions.
		}
	
	