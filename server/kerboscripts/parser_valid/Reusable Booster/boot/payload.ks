// launch boot file

wait until ship:loaded and ship:unpacked.
clearscreen.
wait 1.

switch to 0.
//for ms in core:part:modules { //for some reason terminal sometimes closes on dock
//	set m to core:part:getmodule(ms).
//	if m:hasaction("Open Terminal") m:doevent("Open Terminal").
//}

local tars is list().
list targets in tars.

for t in tars {
	if t:name:contains("Crane") global crane is t.
	else if t:name:contains("Booster") global booster is t.
}
if defined crane and defined booster and altitude < 1000 {
	print crane.
	print booster.
	
	HUDTEXT("Requesting pickup from [" + crane:name + "]", 5, 2, 40, green, false).
	
	//crane:connection:sendmessage(list("bruh", booster)).
	crane:connection:sendmessage(list("bruh",booster:name)).
	
	print "Sent message to drone crane".
}






print "".
print " AG 1: Start Launch.ks ".
print "".
print " AG 2: Quit ".



ag1 off.
ag2 off.
ag10 off.
until ag2 {
	if ag10 reboot. 
	
	//messages
	if not ship:messages:empty {
		local msg is ship:messages:peek.
		
		
		if msg:content = "Lift done" {
			ship:messages:pop.
			ag1 on.
		}
	}

	if ag1 { ag1 off. run launch. set core:bootfilename to "none". }
	wait 0.3.
}
ag2 off.

