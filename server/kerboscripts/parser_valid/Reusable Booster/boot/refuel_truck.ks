clearscreen.
print "Refueling script is running...".
print "Waiting for a request message".

wait until ship:loaded and ship:unpacked.
lights off.


until false {
	wait 0.5.
	if not(ship:messages:empty)  {
		local msg is ship:messages:pop.
		if msg:content = "bruh" {
			global targetVessel is msg:sender.
			if targetVessel:loaded and targetVessel:unpacked {
				global targetPort is targetVessel:partstagged("refueling port")[0].
			}
			else global targetPort is ship:rootpart.
			
			kuniverse:forceactive(ship).
			
			break.
		}
	}
}

run refuel_truck.