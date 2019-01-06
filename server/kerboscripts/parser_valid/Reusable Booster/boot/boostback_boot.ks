// boostback_boot.ks
clearscreen.

wait 5.
print "boostback boot program running, waiting for message to start.".
local done is false.

if altitude > 40000 and ship:messages:empty runpath("0:/boostback.ks", 0).
else wait until kuniverse:timewarp:warp = 0.


if ship:status = "LANDED" {
	local tars is list().
	list targets in tars.
	for t in tars {
		if t:name:contains("Crane") global crane is t.
		else if t:name:contains("Refuel") global refueler is t.
	}
	
	for sr in ship:resources {
		if sr:name = "LiquidFuel" set lf to sr.
		else if sr:name = "Oxidizer" set ox to sr.
	}
	
	
	
	if defined refueler {
		if ((lf:amount + 1) < lf:capacity) or ((ox:amount + 1) < ox:capacity)  {
			HUDTEXT("Requesting refueling from [" + refueler:name + "]", 6, 2, 30, green, false).
			
			wait 2.
			refueler:connection:sendmessage("bruh").
		}
		
		
	}
}

ag10 off.
until done {
	if ag10 {
		ag10 off.
		ship:connection:sendmessage("bruh").
	}
	if not(ship:messages:empty)  {
		local msg is ship:messages:peek.
		
		if msg:content = "bruh" {
			ship:messages:pop.
			wait 1.
			HUDTEXT("Spawning payload", 5, 2, 40, cyan, false).
			wait 3.
			set rand to random().
			if ag5 {
				set rand to 0.1.
			}
			else if ag6 set rand to 0.9.
			ag5 off.
			ag6 off.
			if rand < 0.5 set craft to kuniverse:getcraft("RP-Lander 1","VAB").
			else set craft to kuniverse:getcraft("Payload 42","VAB").
			//local craft is kuniverse:getcraft("Payload 37","VAB").
			//local craft is kuniverse:getcraft("Payload 24","VAB").
			
			//set craft to kuniverse:getcraft("Payload 42","VAB").
			set craft to kuniverse:getcraft("RP-Lander 1","VAB").
			kuniverse:launchcraft(craft).
		}
		else if msg:content = "boostback" {
			ship:messages:pop.
			switch to 0.
			runpath("0:/boostback.ks", 0, msg:sender).
			set done to true.
		}
		else if msg:content = "good luck" {
			ship:messages:pop.
			switch to 0.
			runpath("0:/boostback.ks", 1, msg:sender).
			set done to true.
		}
	}
	wait 0.4.
}