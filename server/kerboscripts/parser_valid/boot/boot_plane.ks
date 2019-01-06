clearscreen.
print "Propeller manager script is running...".
print "[AG 1] Undock propeller".
print "[AG 5] Toggle mode".
print "[H/N] Adjust authority".
print "[I / K] Adjust target angular velocity".
print "--------------------------------------".
wait until ship:unpacked.
core:doevent("open terminal").
set terminal:brightness to 1.
wait until ag1.
print "Propeller vessel undocked.".

wait 0.5.
list targets in allVessels.

set propellerVessel to ship. //dummy
for ves in allVessels {
	if ves:position:mag < 100 {
		for p in ves:parts {
			if p:tag = "propeller" {
				set propellerVessel to ves.
			}
		}
	}
}
if propellerVessel = ship print "Failed to find the propeller vessel, make sure you set the nametag [propeller] on one part.".
else {
	set con to propellerVessel:connection.
	local msg is list("I am your father",ship).
	con:sendmessage(msg).
	set mode to "automatic".
	set targetRads to 47.
	local msg is list("set targetRads", targetRads).
	con:sendmessage(msg).
	set authority to 0.
	
	set y to 10.

	ag10 off.
	until ag10 {
		until ship:messages:empty {
			local packet is ship:messages:pop.
			local msg is packet:content.
			if msg[0] = "authority update" set authority to msg[1].
		}

		
		if ship:control:pilotfore <> 0 { // H or N key is being pressed
			//set authority to min(150,max(-150,authority - ship:control:pilotfore)).
			local msg is list("adjust authority", ship:control:pilotfore * 0.5).
			con:sendmessage(msg).
		}
		if ship:control:pilottop <> 0 { // I or K key is being pressed
			set targetRads to max(0,min(120,targetRads - ship:control:pilottop * 0.02)).
			//local msg is list("set targetRads", targetRads).
			con:sendmessage(list("set targetRads", targetRads)).
		}
		
		if ag5 {
			ag5 off.
			if mode = "automatic" set mode to "manual".
			else set mode to "automatic".
			local msg is list("set mode", mode).
			con:sendmessage(msg).
		}
		
		// ### Terminal ###
	
		print "Mode: " + mode at (0,y + 0).
		print "Target rotation:    " + round(targetRads,2) + " rads/s     " at (0,y + 2).
		print "Propeller rotation: " + round(propellerVessel:angularvel:mag,2) + " rads/s     " at (0,y + 4).
		print "Authority limiter:  " + round(authority,1) + "    " at (0,y + 6).
		wait 0.
	}
}

print "Program ended.".