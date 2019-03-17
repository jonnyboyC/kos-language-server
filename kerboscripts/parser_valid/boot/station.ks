// ### station.ks ###

clearscreen.
print "Station attitude and sanity control.".
wait until ship:loaded and ship:unpacked. 
print "".
print "Running.".
local controlpart is ship:partstagged("control")[0].
controlpart:controlfrom().
lock throttle to 0.
lock steering to st. 


until false {
	set aimVec to -body:angularvel.
	set topVec to vcrs(sun:position,aimVec). //sun
	set st to lookdirup(aimVec, topVec).
	
	wait 0.
}