//drone boot
wait until ship:unpacked and ship:loaded.
ag1 off.
switch to 0.
set terminal:brightness to 1.
//set terminal:width to 30.
//set terminal:height to 20.
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

//local ascending is false.
//local strength is 1.1.
//local strengthIncr is 0.05.
//
//set R to 1.
//set G to 0.
//set B to 0.

setLights(0,0.6,1).
//set phase to 0.
global pickup is false.

until ag1 { 

	
	//if phase = 0 {
	//	if R = 0 set phase to 1.
	//	else {
	//		set R to ROUND(R - 0.1,1).
	//		set G to ROUND(G + 0.1,1).
	//	}
	//}
	//if phase = 1 {
	//	if G = 0 set phase to 2.
	//	else {
	//		set G to ROUND(G - 0.1,1).
	//		set B to ROUND(B + 0.1,1).
	//	}
	//}
	//if phase = 2 {
	//	if B = 0 set phase to 0.
	//	else {
	//		set B to ROUND(B - 0.1,1).
	//		set R to ROUND(R + 0.1,1).
	//	}
	//}
	//
	//setlights(R,G,B).
	//
	//messages
	if not ship:messages:empty {
		local msg is ship:messages:pop.
		
		if msg:content[0] = "bruh" {
			ag1 on.
			global payload is msg:sender.
			global payloadPort is payload:partstagged("payload")[0].
			
			global booster is vessel(msg:content[1]).
			global boosterPort is booster:partstagged("booster")[0].
			set pickup to true.
			
			print payload.
			print booster.
		}
	}
	
	
	wait 0.2.
}

global exit is false.
if ag1 { 
	ag1 off.
	//core:doevent("open terminal").
	runpath("constructor/loader_constructor.ks").
}

print "Program ended".
reboot.