function dockSearch {
	parameter checkPart,originPart. //checkPart is the current part the function is working on, originPart is the part that called it (a child or parent).
	set result to core:part.
	
	for dockpart in core:element:dockingports {
		if checkPart = dockpart { set result to checkPart. } //found a match!
	}
	
	if result = core:part {	//while this is true, a match hasn't been found yet
		if checkPart:hasparent {
			if not(checkPart:parent = originPart) {
				set tempResult to dockSearch(checkPart:parent,checkPart).
				if not(tempResult = core:part) set result to tempResult. //parent returned a match.
			}
		}
		if checkPart:children:length > 0 and result = core:part {
			for child in checkPart:children {
				if not(child = originPart) and result = core:part {
					set tempResult to dockSearch(child,checkPart).
					if not(tempResult = core:part) set result to tempResult. //child returned a match.
				}
			}
		}
	}
	return result. //return the result to the caller (part or initial call from script)
}

function setAuthority {
	parameter val.
	for m in modulesList {
		m:setfield("authority limiter",val).
	}
}

clearscreen.
//core:doevent("open terminal").
set terminal:brightness to 1.
print "Propeller script active.".
wait until ship:unpacked.

set localPort to dockSearch(core:part:parent,core:part).

if localPort:state = "Docked (docker)" or localPort:state = "Docked (dockee)" or localPort:state = "PreAttached" {
	wait until ag1. //remove this line if you just want it to undock without having to use actiongroup 1.
	print "Undocking propeller element.".
	for ms in localPort:modules {
		local m is localPort:getmodule(ms).
		if m:hasevent("Decouple Node") {
			m:doevent("Decouple Node").
		}
		else if m:hasevent("Undock") m:doevent("Undock").
		wait 0.
	}
	wait 0.
	set ship:name to "Propeller".
}

//the propeller vessel is now undocked from the main vessel

set authority to 0.
set modulesList to ship:modulesnamed("ModuleControlSurface").
if modulesList:length > 0 {
	set hasControlSurfaces to true.
	set authority to modulesList[0]:getfield("authority limiter").
	print "initial authority limiters are set to " + authority.
}
print "Amount of adjustable blades found (control surfaces): " + modulesList:length.

set notAnOrphan to false.
set targetRads to 47. //just in case, will probably be instantly overwritten by incomming message
set pid to pidloop(0, 15, 0, -150, 150).
set mode to "automatic".

ag10 off.
until ag10 {
	// ### Handle incomming messages ###
	
	until ship:messages:empty {
		local packet is ship:messages:pop.
		local msg is packet:content.
		if msg[0] = "set mode" set mode to msg[1].
		else if msg[0] = "set targetRads" set targetRads to max(0,min(120,msg[1])).
		else if msg[0] = "adjust authority" set authority to max(-150,min(150,authority + msg[1])).
		else if msg[0] = "I am your father" { set parentVessel to packet:sender. set notAnOrphan to true. }
	}

	local angVel is ship:angularvel:mag.
	
	if mode = "automatic" {
		set pid:setpoint to targetRads.
		set authority to -pid:update(time:seconds, angVel).
	}
	
	
	setAuthority(authority).
	
	if notAnOrphan { local msg is list("authority update",authority). parentVessel:connection:sendmessage(msg). }
	wait 0.
}

print "Program ended.".