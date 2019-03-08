@LAZYGLOBAL on.

//set targetVessel to ship.
//set targetPort to ship:rootpart.

function popup {
	parameter s.
	parameter t is 5.
	HUDTEXT(s, t, 2, 40, yellow, false).
	
	// context: HUDTEXT( Message, delaySeconds, style, size, colour, boolean doEcho).
	//style: - 1 = upper left - 2 = upper center - 3 = lower right - 4 = lower center
}




set mode to 0.



for r in targetVessel:resources {
	if r:name = "LIQUIDFUEL" set targetCapacity to r:capacity.
}
for r in ship:resources {
	if r:name = "LIQUIDFUEL" set fuelAmount to r:amount.
}
if (targetCapacity + 500) > fuelAmount {
	set refilling to true.
	set tankVessel to vessel("Fuel Bro"). 
	set oxidizerport to tankVessel:partstagged("oxidizer")[0].
	set liquidfuelport to tankVessel:partstagged("liquid")[0].
	set targetPort to oxidizerport.
}
else set refilling to false.


local port is ship:partstagged("refuel port")[0].

// servo parts
local gantryPart is ship:partstagged("side")[0].
local verticalJointPart is ship:partstagged("up")[0].
local forward1Part is ship:partstagged("forward")[0].
local forward2Part is ship:partstagged("forward 2")[0].
local upJointPart is ship:partstagged("rot up")[0].
local sideJointPart is ship:partstagged("rot side")[0].

// servos
local gantryServo is addons:ir:partservos(gantryPart)[0].
local verticalJointServo is addons:ir:partservos(verticalJointPart)[0].
local forward1Servo is addons:ir:partservos(forward1Part)[0].
local forward2Servo is addons:ir:partservos(forward2Part)[0].
local upJointServo is addons:ir:partservos(upJointPart)[0].
local sideJointServo is addons:ir:partservos(sideJointPart)[0].

//set gantryServo:acceleration to 4.

function resetServos {

	for s in addons:ir:allservos {
		set s:speed to 1.
		s:movecenter().
	}
}
resetServos().

set wheelPid to PIDLOOP(0.15, 0.0, 0.02, -1, 1).
set throtPid to PIDLOOP(2, 0.0, 0.8, -1, 1).

set reverseSteering to false.

lights on.
set targetDistance to 1.
local frontErr is 999.
set parkingGeoPos to LATLNG(-0.0734059883022779,-74.6206292691976).
set controlPart to ship:partstagged("control")[0].

clearvecdraws().
//local vd_pos is vecdraw(up:vector * 10000,up:vector * -5,yellow,"",1,true,0.5).

set extcam to addons:camera:flightcamera.
set camOldPos to up:vector * 460 + vxcl(up:vector,-targetPort:position):normalized * 180.
set extcam:position to camOldPos.
set extcam:fov to 65.
wait 0.
set extcam:target to port.

wait 0.
set extcam:position to camOldPos.
wait 0.

set upVector to up:vector.

// ### Loop ###
ag10 off.
local exit is false.
until exit or ag10 {
	
	
	// ### Refueling ###
	// >>
	if port:state:contains("Docked") {
		for s in addons:ir:allservos {
			s:stop().
		}
		set mode to 3.
		controlPart:controlfrom().
		
		wait 0.5.
		list elements in el.
		for e in el {
			if e:name:contains("booster") set boosterElement to e.
			else if e:name:contains("refuel") set localElement to e.
			else if e:name:contains("Fuel Bro") set tankElement to e.
		}
		
		if (targetPort:tag = "oxidizer") {
			popup("Pumping Oxidizer..").
			set transfer to transferall("OXIDIZER", tankElement, localElement).
			set transfer:active to true.
			wait until transfer:status <> "Transferring".
			wait 1.
			set mode to 2.
			targetPort:undock. 
			port:undock.
			wait 0.1.
			if not(kuniverse:activevessel = port:ship) {
				kuniverse:forceactive(port:ship).
				set extcam:target to port.
			}
			set targetPort to liquidfuelport.
			set forward2Servo:speed to 3.
			forward2Servo:moveleft().
			wait 0.4.
		}
		else if (targetPort:tag = "liquid") {
			popup("Pumping Liquid Fuel..").
			set transfer to transferall("LIQUIDFUEL", tankElement, localElement).
			set transfer:active to true.
			wait until transfer:status <> "Transferring".
			wait 1.
			set mode to 4.
			targetPort:undock. 
			port:undock.
			wait 0.1.
			if not(kuniverse:activevessel = port:ship) {
				kuniverse:forceactive(port:ship).
				set extcam:target to port.
			}
			set forward2Servo:speed to 3.
			forward2Servo:moveleft().
		}
		else {
			popup("Pumping Oxidizer..").
			set transfer to transferall("OXIDIZER", localElement, boosterElement).
			set transfer:active to true.
			wait until transfer:status <> "Transferring".
			//wait 6.
			popup("Pumping Liquid Fuel..").
			set transfer to transferall("LIQUIDFUEL", localElement, boosterElement).
			set transfer:active to true.
			wait until transfer:status <> "Transferring".
			//wait 6.
			set mode to 4.
			targetPort:undock. 
			port:undock.
			wait 0.1.
			set extcam:target to targetPort:ship.
			set extcam:position to north:vector * 50 + up:vector * 50.
			//kuniverse:forceactive(targetPort:ship).
			
			
			popup("Refueling complete").
			wait 1.
		}
		
		
		
		
		
		wait 0.
	}
	
	// <<
	
	//### Navigation ###
	// >>
	// This section is an utter mess. I'm so sorry.
	set validTarget to targetPort <> ship:rootpart.
	
	if validTarget or mode > 3 {
		//set wheelPid:kP to ((mass/663)) * 0.5.
		
		//set wheelPid:kD to (mass/663000) * 0.1.
		
		if refilling and validTarget {
			set targetPosition to (oxidizerport:nodeposition + liquidfuelport:nodeposition)/2.
			set targetFacing to oxidizerport:portfacing:vector.
		}
		else if validTarget = false { //booster vessel not unpacked
			set targetPosition to targetVessel:position.
			set targetFacing to upVector.
			set wpDirection to upVector.
		}
		else {
			set targetPosition to targetPort:nodeposition.
			set targetFacing to targetPort:portfacing:vector.
		}
		
		if mode = 0 {
			set targetPositionHor to -vxcl(upVector,targetPosition).
			set wpDirectionAng to vang(targetPositionHor, vxcl(upVector,targetFacing)).
			if vdot(vcrs(targetPositionHor,upVector) , targetFacing) > 0 set wpDirectionAng to -wpDirectionAng.
			
			set wpDirection to angleaxis(max(-35,min(35,wpDirectionAng)), upVector) * targetPositionHor.
			set wpDirection:mag to 60.
			
			set extcam:position to extcam:position * 0.96 + 0.04 * (-targetPosition:normalized * 15 + upVector * 8).
			
			if defined wpDistance and wpDistance < 28 {
				set mode to 1.
				if vdot(facing:starvector,targetPosition) < 0 set camLeft to false.
				else set camLeft to true.
				wait 0.
			}
		}
		else if mode = 1 {
			set wpDirection to vxcl(upVector,targetFacing).
			set wpDirection:mag to max(0.1, vxcl(upVector,targetPosition):mag - 10 ).
			
			set camSideOffset to facing:starvector * min(15,3 + frontErr/2).
			if camLeft set camSideOffset to -camSideOffset.
			
			set extcam:position to extcam:position * 0.98 + 0.02 * (port:position + facing:vector * -(2 + min(10,frontErr/4)) + camSideOffset + upVector * min(10,frontErr/2)) .
			
			
			if forward2Servo:ismoving or abs(frontErr) < 0.5 set mode to 2.
		}
		else if mode = 4 and vxcl(upVector,targetPosition):mag > 35 {
			if refilling {
				set mode to 0.
				set refilling to false.
				set targetPort to targetVessel:partstagged("refueling port")[0].
				set frontErr to 999.
			}
			
			else {
				set mode to 5.
				popup("Returning to parking spot").
			}
		}
		
		if mode = 5 {
			set targetPositionHor to vxcl(upVector,targetPosition).
			set parkingPos to vxcl(upVector,parkingGeoPos:position).
			if vang(targetPositionHor, parkingPos) > 89 {
				set wp to parkingGeoPos.
				if parkingPos:mag < 25 set exit to true. //end of program, what a mess.
			}
			else {
				set wpPos to vxcl(targetPositionHor,parkingPos):normalized * 35.
				set wp to body:geopositionof(wpPos).
			}
			
		}
		else {
			set wp to body:geopositionof(targetPosition + wpDirection).
		}
		
		set wpPos to wp:position.
		set wpPosHor to vxcl(upVector,wpPos).
		set wpDistance to wpPosHor:mag.
		
		//set vd_pos:start to wpPos + upVector * 5.
		
		
		set wpBearing to vang(vxcl(upVector,facing:vector), wpPosHor).
		if vdot(facing:starvector,wpPos) < 0 set wpBearing to -wpBearing.
		
		
		set forwardSpeed to vdot(facing:vector,velocity:surface).
		
		set wheelPid:kP to 0.4 - min(0.35,max(0,forwardSpeed - 3) / 10 ). //PIDLOOP(0.15, 0.0, 0.03, -1, 1).
		
		if  wpDistance > 0.5 {
			set ship:control:wheelsteer to wheelPid:update(time:seconds, wpBearing).
		}
		else set ship:control:wheelsteer to 0.
		
		
		
		
		if forwardSpeed < 0 set ship:control:wheelsteer to -ship:control:wheelsteer.
		
		//if abs(wpBearing) > 5 set targetSpeed to 0.
		//else 
		set targetSpeed to min(25 , (wpDistance^0.87) / 2.5).
		if mode = 1 {
			if reverseSteering and abs(wpBearing > 10) { set targetSpeed to -2. set ship:control:wheelsteer to ship:control:wheelsteer * 2. }
			else if abs(wpBearing) > 30 { 
				set targetSpeed to -5. 
				set reverseSteering to true. 
			}
			else {
				set targetSpeed to min(4, vxcl(facing:starvector,targetPosition - port:nodeposition):mag / 4 ).
				set reverseSteering to false.
			}
		}
		else if mode = 4 {
			set targetSpeed to -10.
			set ship:control:wheelsteer to 0.
		}
		
		
		if mode = 2 or mode = 3 {
			set ship:control:wheelsteer to 0.
			set ship:control:wheelthrottle to 0.
		}
		else set ship:control:wheelthrottle to throtPid:Update(time:seconds, forwardSpeed - targetSpeed).
		
		if mode = 2 {
			brakes on.
			//set extcam:position to extcam:position * 0.985 + 0.015 * (port:position + port:facing:vector * -5 + upVector * (1 + vdot(upVector,gantryPart:position - port:position))).
			if camLeft set extcam:position to extcam:position * 0.98 + 0.02 * (vxcl(facing:starvector,core:part:position) + facing:starvector * (-1.5 + vdot(facing:starvector, port:position)) + upVector * 2).
			else set extcam:position to extcam:position * 0.98 + 0.02 * (vxcl(facing:starvector,core:part:position) + facing:starvector * (1.5 + vdot(facing:starvector, port:position)) + upVector * 2).
			
		}
		else if mode = 4 or targetSpeed < 0 brakes off.
		else if abs(forwardSpeed - targetSpeed) < 0.4 brakes off.
		else if (forwardSpeed - targetSpeed) > 0.1 brakes on.
		else brakes off.
		
		if targetSpeed > forwardSpeed and forwardSpeed < -0.1 brakes on.
		
		//print round(wheelPid:kP,3) + " kP   " at (0, 20).
		//print round(ship:control:wheelsteer,2) + " wheelsteer" at (0, 21).
		
		//print "wp bearing: " + round(wpBearing,1) + "      " at (0,5).
		//print "wp dist: " + round(wpDistance,1) + "      " at (0,6).
		//print "targetSpeed: " + round(targetSpeed,1) + "      " at (0,7).
	}
	// <<
	
	//### Docking arm ###
	// >>
	
	if mode = 3 {}
	else if mode = 4 { forward2Servo:moveleft(). forward1Servo:moveleft(). }
	else if targetPort = ship:rootpart resetServos().
	else if (targetPort:position - port:position):mag > 20 resetServos().
	else {
		set portPosition to port:nodeposition.
		set portFacing to port:portfacing.
		set portVec to portFacing:vector.
		set portTopVec to portFacing:topvector.
		set portStarVec to portFacing:starvector.
		
		
		
		
		
		
		// ### dockingport angling ###
		set portAimVec to -targetFacing.
		
		//vertical
		set upAngErr to vang( vxcl(portStarVec,portVec), vxcl(portStarVec,portAimVec) ).
		set upJointServo:speed to min(5,upAngErr * 0.1). 
		if vdot(portTopVec, portAimVec) > 0 set upAngErr to -upAngErr.
		
		if upAngErr < 0 upJointServo:moveright().
		else if upAngErr > 0 upJointServo:moveleft().
		else upJointServo:stop().
		//print "up angle err: " + round(abs(upAngErr),2) + "   " at (0,10).
		
		//horizontal
		set sideAngErr to vang( vxcl(portTopVec,portVec), vxcl(portTopVec,portAimVec) ).
		set sideJointServo:speed to min(5,sideAngErr * 0.1). 
		if vdot(portStarVec, portAimVec) > 0 set sideAngErr to -sideAngErr.
		
		if sideAngErr < 0 sideJointServo:moveright().
		else if sideAngErr > 0 sideJointServo:moveleft().
		else sideJointServo:stop().
		//print "side angle err: " + round(abs(sideAngErr),2) + "   " at (0,11).
		
		
		// ### Translation ###
		
		set errVec to targetPort:nodeposition - portPosition.
		
		set frontErr to vdot(portVec,errVec).
		set upErr to vdot(portTopVec,errVec).
		set sideErr to vdot(portStarVec,errVec).
		
		
		
		//side
		set gantryServo:speed to min(2,abs(sideErr) * 3).
		if sideErr < -0.004 gantryServo:moveleft().
		else if sideErr > 0.004 gantryServo:moveright().
		else gantryServo:stop().
		
		//up
		set verticalJointServo:speed to min(0.5,abs(upErr) * 0.1).
		if forward1Servo:ismoving and upErr > 0 verticalJointServo:stop().
		else if upErr > 0.003 verticalJointServo:moveleft().
		else if upErr < -0.012 verticalJointServo:moveright().
		else verticalJointServo:stop().
		
		//if abs(verticalJointServo:position) > 45 {
			set forward1Servo:speed to abs(upErr) * 10.
			if upErr < -0.015 or verticalJointServo:position > -15 forward1Servo:moveleft().
			else if upErr > 0.005 forward1Servo:moveright().
			else forward1Servo:stop().
			
		//}
		//else forward1Servo:stop().
		
		//forward 2 (the little extendatron on the tip):
		if (mode = 1 or mode = 2) and abs(upErr) < 0.1 and abs(sideErr) < 0.1 and abs(sideAngErr) < 2 and abs(upAngErr) < 2 and (frontErr < 0.8 or mode = 2) {
			forward2Servo:moveright().
			set forward2Servo:speed to min(5,0.2 + frontErr * 6).
		}
		else {
			forward2Servo:moveleft().
			set forward2Servo:speed to min(5,1 + frontErr * 8).
		}
		//print "front error: " + round(frontErr,2) + "   " at (0,13).
		//print "up error: " + round(upErr,2) + "   " at (0,14).
		//print "side error: " + round(sideErr,2) + "   " at (0,15).
	}
	// << end of arm
	
	//print "mode: " + mode at (0,18).
	
	wait 0.03.
}

clearvecdraws().
lights off.
brakes on.
SET SHIP:CONTROL:NEUTRALIZE to TRUE.
wait until groundspeed < 0.1.

if mode = 5 or ag10 {
	targetPort:ship:connection:sendmessage("bruh").
	ag10 off.
}

print "Program ended".
reboot.