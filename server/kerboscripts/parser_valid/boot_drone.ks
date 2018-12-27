//drone boot
ag1 off. ag2 off. ag3 off.
switch to 0.
set terminal:brightness to 1.
//set terminal:charwidth to 12.
//set terminal:charheight to 12.
clearscreen.
print "In standby".
print "-------------------------".
print "[AG 1]  START".
print "[AG 2]  Force compile all".
print "[AG 3]  Exit boot program".
print "-------------------------".
print " ".

wait until ship:unpacked.

runoncepath("cpu_light.ks").

local ascending is false.
local strength is 1.1.
local strengthIncr is 0.05.
until ag1 or ag3 { 
	if ag2 { 
		ag2 off. 
		runpath("cq.ks",0). 
	}
	
	if ascending set strength to strength + strengthIncr.
	else set strength to strength - strengthIncr.
	if strength <= 0.3 or strength >= 1.1 toggle ascending.
	setLights(0,0.45 * strength,1 * strength).
	
	wait 0.08.
}
ag3 off.
if ag1 { 
	ag1 off.
	core:doevent("open terminal").
	run q. 
}

print "Program ended".