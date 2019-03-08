// #############
// ### SETUP ###

clearscreen.
clearvecdraws().

set drone to ship.
set s_ready to 0.
set s_approach to 1.
set s_docked to 2.
set dockingstate to s_ready.

//set bay to ship:partstitled("mk3CargoBayL")[0].
//set bayMod to bay:getmodule("ModuleAnimateGeneric").
set aimPoint to ship:partstagged("aimPoint")[0].

local freePorts is ship:partstagged("R").
if freePorts:length = 0 local freePorts is ship:partstagged("X").
set port to freePorts[0].

set isDocked to getPortState().
if isDocked set port:tag to "X".
else set port:tag to "R".

for g in addons:ir:groups {
	if g:name = "rail" {
		set rail to g:servos[0].
		set rail:acceleration to 4.
	}
	else if g:name = "arm" set arm to g.
	else if g:name = "end" {
		set end to g.
		set endServo to g:servos[0].
		set endServo:acceleration to 50.
	}
	else if g:name = "cam pitch" set camPitch to g.
}

// #################
// ### FUNCTIONS ###

function getPortState {
	local portSatus is port:state.
	if portSatus = "Docked (docker)" or portSatus = "Docked (dockee)" return true.
	else return false.
}
function defaultPortPitch {
	set endServo:speed to 1.
	endServo:moveto(-90,0.5).
}
function resetAll {
	set dockingstate to s_ready.
	set port:tag to "R".
	set drone to ship.
	
	setArmSpeed(1).
	set rail:speed to 0.5.
	
	rail:movecenter().
	arm:movecenter().
	defaultPortPitch().
}
function setArmSpeed {
	parameter sp.
	for s in arm:servos {
		if s:part:name = "IR.Foldatron.Extended" set s:speed to sp / 2.
		else set s:speed to sp.
	}
}

// ############
// ### LOOP ###

until false {
	set isDocked to getPortState().
	
	
	// ### MESSAGES
	set queue to ship:messages.
	if not queue:empty { //received a message
		set msg to queue:pop.
		set cnt to msg:content.
		
		if cnt = "dock" {
			
			
			set port:tag to "X".
			set dockingstate to s_approach.
			set drone to msg:sender.
			set dronePort to drone:dockingports[0].
			
		}
		else if cnt = "abort" or cnt = "undock" {
			resetAll().
		}
	}
	
	// ### SERVOS
	if dockingstate = s_approach {
		if isDocked { //detected a recent dock, switch to docked mode
			set dockingstate to s_docked.
			defaultPortPitch().
			arm:stop().
			rail:stop().
		}
		else {
			local portVec is port:facing:vector.
			local portPos is port:position + portVec * 0.13.
			
			local relativeV is drone:velocity:surface - ship:velocity:surface.
			local relativeHV is vxcl(ship:facing:topvector,relativeV).
			local portTopVec is vcrs(portVec,ship:facing:starvector).
			
			//docking arm and rail groups
			local dronePortPos is dronePort:position + dronePort:facing:vector * 0.13.
			local dronePosVec is dronePortPos - portPos. //relative to plane's dockingport
			
			//from dockingport's frame of reference
			local droneForward is vdot(portVec,dronePosVec).
			local droneSide is vdot(ship:facing:starvector,dronePosVec).
			local droneUp is vdot(portTopVec,dronePosVec).
			
			//from plane's frame of reference
			local droneUpShip is vdot(ship:facing:topvector,dronePosVec).
			
			local frontOffset is vdot(-ship:facing:vector, dronePortPos - aimPoint:position).
			local upOffset is vdot(-ship:facing:topvector, dronePortPos - aimPoint:position).
			
			
			if abs(frontOffset) < 4 and relativeV:mag < 0.7 { //move closer
				local sideErr is vxcl(dronePort:facing:vector,portPos - dronePortPos):mag.
				local movePortTo is dronePortPos + dronePort:facing:vector * sideErr * 1.5.
				
				local errVec is movePortTo - portPos.
				local frontErr is vdot(ship:facing:vector,errVec).
				local upErr is vdot(ship:facing:topvector,errVec).
				
				setArmSpeed(min(3,abs(upErr) * 1)).
				if upErr < 0 arm:moveleft().
				else arm:moveright().
				
				set rail:speed to min(3,abs(frontErr * 6)).
				print "railspeed: " + round(rail:speed,1) + "  " at (0,14).
				if frontErr > 0 rail:moveleft().
				else rail:moveright().
				
				set vd1 to vecdraw(portPos,errVec,rgba(0.5,0.5,0,1),"",1,true,0.2). 
			}
			else { //too unstable, pull back
				set rail:speed to 0.5.
				//set arm:speed to 0.5.
				setArmSpeed(0.5).
				rail:movecenter().
				arm:movecenter().
			}
			
			print "Forward distance: " + round(droneForward,1) + "m     " at (0,2).
			print "Forward offset:   " + round(frontOffset,2) + "m     " at (0,3).
			print "Up distance: " + round(droneUp,1) + "m     " at (0,5).
			print "Up offset:   " + round(upOffset,2) + "m     " at (0,6).
			print "Side distance: " + round(droneSide,1) + "m     " at (0,8).
			
			//docking port pitch aim
			local dronePortVec is vxcl(ship:facing:starvector,drone:facing:vector).
			set portAimVec to -dronePortVec.

			
			set vertAngErr to vang(vxcl(ship:facing:starvector,portVec), portAimVec).
			set endServo:speed to min(8,vertAngErr * 1). 
			if vdot(portTopVec, portAimVec) < 0 set vertAngErr to -vertAngErr.
			
			if vertAngErr < 0 endServo:moveright().
			else if vertAngErr > 0 endServo:moveleft().
			else endServo:stop().
			
			print "vertical angle err: " + round(abs(vertAngErr),1) + "   " at (0,10).
		}
	}
	else if dockingstate = s_ready {
		//set portAimVec to -ship:facing:topvector.
	}
	else if dockingstate = s_docked {
		//set portAimVec to -ship:facing:topvector.
		if not isDocked { //surprise undock happened, make ready for new ones
			resetAll().
		}
	}
	
	
	
	
	//set vertAngOffset to vertAngOffset + vertAngErr * 0.1.
	//endServo:moveto(vertAngErr,1).
	
	//set bayState to bayMod:getfield("status").
	
	print "state: " + dockingstate at (0,1).
	wait 0.
}