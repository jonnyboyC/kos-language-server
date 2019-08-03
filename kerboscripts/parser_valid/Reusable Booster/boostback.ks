parameter runmode is 0, payload is ship.
set entryTime to time:seconds - 1.

set debug to false.

clearvecdraws().
loaddist(100000). //flying and suborbital

wait until ship:unpacked and ship:loaded.

if debug {
	for ms in core:part:modules { //for some reason terminal sometimes closes on dock
		set m to core:part:getmodule(ms).
		if m:hasaction("Open Terminal") m:doevent("Open Terminal").
	}
}

print(10). 

if choose 10 if true else false {
	print(10).
}

local x is choose "boat"
	if true
	else false.

print "Boostback script running.".

local gloc is LATLNG(-0.056537521336225,-74.6246793127239). //KSC runway refueling area
//local gloc is LATLNG(-0.0972098829757138, -74.557676687929). //Launchpad
//local gloc is LATLNG(-1.52807550218625,-71.8857609633566). //island runway
//local gloc is LATLNG(6.84003072705819, -62.3143155921253). //island (north) resort

//east continent:
//local gloc is LATLNG(-3.69868452018539,-40.2857948658593). //lz2
//local gloc is LATLNG(-3.56930348556625,-40.2248383004123). //lz2 mnt
//local gloc is LATLNG(1.04954086727854,-42.7077262412699). //LZ-3

//west:
//local gloc is LATLNG(20.6225723742333, -146.431600245751). //ksc2 pad
//local gloc is LATLNG(22.727435661152, -120.969904966499). //lake dermal
//local gloc is LATLNG(10.6432864032526,-132.030819020903). //KKVLA

set overshoot to 500.
set targetApo to 85000.
set overshoot2 to overshoot.
set reEntryBurn to false.
local lng_diff is abs(70 + gloc:lng).
if lng_diff > 15 { 
	set targetApo to 130000.
	set overshoot2 to lng_diff * 1000.
	set reEntryBurn to true.
}

for sr in ship:resources {
	if sr:name = "LiquidFuel" set lf to sr.
	else if sr:name = "Oxidizer" set ox to sr.
}

sas off.
rcs on.

local th is 0.
lock throttle to th.

//kuniverse:forceactive(ship).
wait 0.


local st is facing:vector.
//local st is heading(gloc:heading,0):vector.
lock steering to lookdirup(st,ship:facing:topvector).

steeringmanager:resettodefault().
wait 0.

//set steeringmanager:pitchtorqueadjust to 0.
//set steeringmanager:yawtorqueadjust to 0.

set steeringmanager:pitchts to 2.
set steeringmanager:yawts to 2.

set STEERINGMANAGER:PITCHPID:KP to 1.1.
set STEERINGMANAGER:yawPID:KP to 1.1.

set extcam to addons:camera:flightcamera.
local default_fov is 70.


if runmode = 0 {
	wait 0.
	set extcam:fov to default_fov.
	set extcam:position to vcrs(up:vector,velocity:orbit):normalized * 50.
	
	set SHIP:CONTROL:FORE to -0.9.
	
	set steeringmanager:maxstoppingtime to 6.
	
	//set st to angleaxis(40,vcrs(up:vector,velocity:orbit)) * -velocity:orbit.
	set st to facing:vector.
	
	wait until addons:tr:hasimpact.
	
	
	set ship:control:neutralize to true.
	//set st to vxcl(up:vector, gloc:position - addons:tr:impactpos:position):normalized + up:vector * ((targetApo - apoapsis)/ 15000).
	//wait until vang(steering:vector,facing:vector) < 40.
	
}

when altitude < body:atm:height and verticalspeed < 0 then {
	for m in ship:modulesnamed("ModuleAnimateGeneric") {
		if m:hasevent("deploy fins") m:doevent("deploy fins").
	}
	brakes on.
	return false.
}


set STEERINGMANAGER:PITCHPID:KD to 0.5.
set STEERINGMANAGER:yawPID:KD to 0.5.
set steeringmanager:maxstoppingtime to 6.

when altitude < 60000 and verticalspeed < 0 and vang(facing:vector,st) < 10 then {
	//we'll have a lot more torque to play with in atmo, ease up on the agressiveness
	set STEERINGMANAGER:PITCHPID:KD to 0.
	set STEERINGMANAGER:yawPID:KD to 0.
	set steeringmanager:maxstoppingtime to 4.
	
	HUDTEXT("Fuel remaining: " + round(100 * ox:amount/ox:capacity,2) + "%", 10, 2, 30, yellow, false).
	if ox:amount < 590 HUDTEXT("RIP", 10, 2, 25, red, false).
	else if ox:amount < 630 HUDTEXT("Critically low", 10, 2, 25, red, false).
	else if ox:amount < 690 HUDTEXT("Cutting it close", 10, 2, 25, rgb(1,0.5,0), false).
	else if ox:amount < 800 HUDTEXT("Sufficient", 10, 2, 25, yellow, false).
	else HUDTEXT("Plenty", 10, 2, 25, green, false).
}

addons:tr:settarget(gloc).

set oldT to time:seconds - 0.02.
set oldV to verticalspeed.

local height_offset is estimate_height() + 5.
local th_pid is pidloop(0.3,0.1,0.001,-1,1).

if debug {
	set vd_hit to vecdraw(gloc:position,up:vector * 500, red, "", 1, true, 30).
	set vd_tar to vecdraw(gloc:position,up:vector * 500, green, "", 1, true, 30).
	set vd_error to vecdraw(v(0,0,0),v(0,0,0), yellow, "", 1, true, 0.5).
}

local geo_diff is v(0,0,0).
local cinematic is true.
local randomMode is 0.
local camMode is 0.
local camTimer is 10.
local randomSeed is random().
set hasCam to false.
if ship:partstagged("cam"):length > 0 {
	set camMod to ship:partstagged("cam")[0]:getmodule("MuMechModuleHullCameraZoom").
	set hasCam to true.
}

local engs is 0.
list engines in engs.

local done is false.
until done {
	set upVector to up:vector.
	
	if ship:status = "landed" break.
	//print "dyn press: " + round(ship:q,5) + "      " at (0,9).
	
	if runmode = 0 { //boost back
		
		if addons:tr:hasimpact {
			local offset is vxcl(gloc:position-body:position,gloc:position).
			set offset:mag to overshoot2.
			local st_vec is vxcl(up:vector, offset + gloc:position - addons:tr:impactpos:position).
			set st to st_vec:normalized + up:vector * max(0,(targetApo - apoapsis)/ 15000).
			
			//if st_vec:mag < 40000 set warp to 0.
			
			local steer_error is vang(facing:vector,st) - 5.
			if steer_error < 25 set th to min(1,st_vec:mag / 15000).
			else set th to 0.
			set th to min(th,(25 - steer_error) / 25).
			
			//print "dist " + round(st_vec:mag) + "          " at (0,10).
			if st_vec:mag < 200 {
				set runmode to 1.
				HUDTEXT("Boostback burn complete. Switching to second stage.", 4, 2, 30, green, false).
				set th to 0.
				local i is 4.
				until i <= 0 {
					set st to facing:vector.
					set i to i - 0.02.
					wait 0.
				}
				
				if payload <> ship kuniverse:forceactive(payload). //### switch to payload so it can circularize
				wait 1.
				wait until kuniverse:activevessel = ship.
			}
		}
		else {
			set st to vxcl(up:vector,-velocity:orbit).
			set th to 1.
		}
		
		//camera during boostback
		set extcam:fov to default_fov.
		if payload:distance < 1500 set extcam:position to extcam:position * 0.95 + 0.05 * (vcrs(up:vector,velocity:orbit):normalized * 10 + payload:position:normalized * -40).
		else set extcam:position to extcam:position * 0.97 + 0.03 * (upVector * 10 + angleaxis(7.5,upVector) * (vxcl(upVector,extcam:position):normalized * 40)).
		
	}
	else if runmode = 1 {
		set th to 0.
		if alt:radar < 1200 gear on.
		if altitude < 15000 rcs off.
		
		set offset to vxcl(gloc:position-body:position,gloc:position).
		set offset:mag to min(overshoot,vxcl(up:vector,gloc:position):mag / ((90 - vang(up:vector, -velocity:surface)) * 0.4) ). // /12
		local target_pos is gloc:position + offset.
		set target_gloc to body:geopositionof(target_pos).
		
		
		
		
		
		
		if kuniverse:activevessel = ship {
			addons:tr:settarget(target_gloc).
			set posError to target_gloc:position - addons:tr:impactpos:position.
			set geo_diff to geo_diff * 0.8 + 0.2 * vxcl(target_gloc:position - body:position, posError).
			//print "dist " + round(geo_diff:mag) + "          " at (0,10).
		}
		
		if debug {
			set vd_hit:start to addons:tr:impactpos:position.
			set vd_tar:start to target_gloc:position.
			set vd_hit:vec to up:vector * (500 + altitude / 3).
			set vd_tar:vec to up:vector * (500 + altitude / 3).
			
			set vd_error:vec to geo_diff.
		}
		
		
		if vang(up:vector,facing:vector) < 80 and altitude < 20000 {
			local max_acc is ship:availablethrust / ship:mass.
			local gravityMag is body:mu / (body:radius + altitude)^2.
			//local gravityVec is -up:vector * gravityMag.
			
			//if throttle = 0 {
			//	local dt is time:seconds - oldT.
			//	set oldT to time:seconds.
			//	set accel to (verticalspeed-oldV)/dt.
			//	set oldV to verticalspeed.
			//	
			//	set accel to max(0,accel - gravityMag).
            //
			//	//print "drag acc: " + round(accel,2) + " m/s2        " at (0,20).
			//	
			//}
			//else set accel to 0.
			
			local max_v_acc is max(0.6,vdot(up:vector,facing:vector)) * max_acc - gravityMag.
			
			//set vdist_offset to min(100,max(0,vxcl(up:vector,gloc:position):mag - 15) * 0.3).
			set vdist_offset to min(100,max(0,vxcl(up:vector,velocity:surface):mag - 2) * 0.1). //min(100,max(0,vxcl(up:vector,velocity:surface):mag - 6) * 0.5).
			//set vdist_offset to 0.
			
			set vdist to altitude - max(0,max(0,gloc:terrainheight)) - 33.4 - vdist_offset. //height_offset.
			set desiredVV to -sqrt( 2 * max(0.01,vdist + verticalspeed * 0.02) * max(max_v_acc,0.01) ).
			
			//print "vertical dist: " + round(vdist/1000,1) + " km          " at (0,11).
			//print "desired v speed: " + round(desiredVV) + " m/s        " at (0,14).
			//print "speed error: " + round(verticalspeed - desiredVV,1) + " m/s        " at (0,16).
			
			//print "height offset: " + round(height_offset,1) at (0,18).
			
			
			if vdist > 1700 set th to 0.
			else {
				set th_pid:setpoint to min(-3,desiredVV).
				set th to 0 + th_pid:update(time:seconds,verticalspeed).
				//if th < 0.5 set th to 0.
			}
			
			if verticalspeed > -2 and altitude < 10000 set th to 0.
		}
		
		// ### Steering / gliding ###
		if  (altitude > body:atm:height and verticalspeed > 0) or (verticalspeed > 0 and altitude > 10000) {
			if entryTime < time:seconds set entryTime to entryETA().
			set st to -velocityat(ship,entryTime):surface.
			print "re-entry ETA: " + round(entryTime - time:seconds) + "s       " at (0,11).
			if vang(st,facing:vector) < 15 and altitude > body:atm:height + 100 {
				set kuniverse:timewarp:mode to "rails".
				wait 0.
				if reEntryBurn { //warp to and do re-entry burn to steepen/slow trajectory
					kuniverse:timewarp:warpto(entryTime - 25).
					wait until time:seconds > entryTime - 20.
				}
				else { //just warp to re-entry, no burn needed
					kuniverse:timewarp:warpto(entryTime - 5).
					wait until altitude < body:atm:height.
				}
			}
		}
		else if altitude > 50000 and vdot(vxcl(up:vector,velocity:surface):normalized,geo_diff) < -300 {
			set st to vxcl(up:vector,geo_diff).
			set th to (10 - vang(st, facing:vector)) / 8.
			set th to min(th, geo_diff:mag / 3000).
		}
		else if th > 0.2 {
			
			//if velocity:surface:mag > 550 set st to -velocity:surface.
			if verticalspeed >= 0 set st to up:vector. //just some sanity check in case we are going upwards, which we shouldn't 
			else if vdist + vdist_offset < 150 {
				set st to -velocity:surface + vxcl(up:vector,-velocity:surface) * min(2,(vdist + vdist_offset - 200)/300).
			}
			else {
				set geo_diff to vxcl(up:vector, (gloc:position + offset * 0.7) - addons:tr:impactpos:position).
				local ang is 0.
				
				local strength is min(50,abs(300 - velocity:surface:mag))/ 50.
				if velocity:surface:mag > 300 * th {
					set strength2 to 1 / max(1,velocity:surface:mag/400).
					set ang to -min(15,geo_diff:mag / 3) * strength * strength2.
				
				}
				else {
					set geo_diff to geo_diff + 2 * vxcl(up:vector,vxcl(velocity:surface,posError)). //increase sideways correction in final burn
					set ang to min(15,geo_diff:mag / 3) * strength.
				}
				
				local axis is vcrs(-velocity:surface,geo_diff).
				set st to -velocity:surface * angleaxis(ang,axis).
			}
			
			
		}
		else { //use body lift to decrease hit pos error
			local ang is min(15,(geo_diff:mag/(1 + ship:q * 1 + vang(up:vector,-velocity:surface) / 15)) / 3).
			//if altitude > 20000 set ang to min(15,ang * altitude/15000).
			local axis is vcrs(-velocity:surface,geo_diff).
			set st to -velocity:surface * angleaxis(-ang,axis).
		}
		
		
		// ### Camera stuff
		if cinematic {
			if altitude > 1900 set sideAxis to vcrs(upVector,velocity:surface):normalized.
			set camTimer to camTimer - 0.02.
			if camTimer < 0 and (altitude > 1900 or verticalspeed > 0) {
				if camMode = 2 and hasCam {
					camMod:doevent("Activate Camera"). 
					wait 0.
					set extcam:target to ship.
				}
				
				set camMode to camMode + 1.
				if camMode > 4 set camMode to 0.
				
				//until randomMode <> camMode set randomMode to floor(random() * 6.9999).
				//set camMode to randomMode.
				
				set camTimer to round(8 + random() * 6).
				set extcam:fov to default_fov.
				
				if altitude < 12000 set camMode to 2.
				
				if camMode = 0 set camTimer to camTimer * 0.75.
				else if camMode = 2 {
					if hasCam {
						camMod:doevent("Activate Camera").
						set camTimer to camTimer * 1.3.
					}
					else set camMode to 3.
				}
				if camMode = 3 set camTimer to camTimer * 1.5.
				
				set randomSeed to random().
			}
			
			if camMode = 0 or altitude < 1900 { //side
				if camMode = 2 { camMod:doevent("Activate Camera"). set extcam:target to ship. }
				if altitude < 1900 {
					set extcam:position to sideAxis:normalized * (30 + randomSeed * 10 * (altitude/1900)) + upVector * 30 * (1 - altitude/1900).
				}
				else set extcam:position to sideAxis:normalized * (30 + randomSeed * 20) + upVector * 20 * (1-randomSeed).
				set camMode to 0.
			}
			else if camMode = 1 { //retro
				set extcam:position to angleAxis(-3, sideAxis) * (velocity:surface:normalized * (-30 - randomSeed * 15)).
			}
			else if camMode = 3 {  //front to back
				if randomSeed < 0.5 set sideAxis to -sideAxis.
				set extcam:position to sideAxis * (8 + 15 * randomSeed) + velocity:surface:normalized * (camTimer - 7) * (9 + 11 * randomSeed).
			}
			else if camMode = 4 { //rotating
				set extcam:position to extcam:position * 0.8 + 0.2 * ( angleaxis((randomSeed -0.5) * 5,upVector) * (vxcl(upVector,extcam:position):normalized * (50 - randomSeed * 20)) + upVector * randomSeed * 20).
			}
		}
	}
	
	
	
	
	wait 0.
}

for m in ship:modulesnamed("ModuleAnimateGeneric") {
	if m:hasevent("retract fins") m:doevent("retract fins").
}

unlock throttle.
unlock steering.
set ship:control:pilotmainthrottle to 0.
SET SHIP:CONTROL:NEUTRALIZE to TRUE.
sas off.
rcs off.
wait 2.
HUDTEXT("Fuel remaining: " + round(100 * ox:amount/ox:capacity,2) + "%", 8, 2, 30, yellow, false).
local elist is 0.
list engines in elist.
for e in elist {
	e:shutdown.
}

reboot.

function estimate_height {
	local highest is 0.
	for p in ship:parts {
		local part_h is vdot(-facing:vector,p:position).
		set highest to max(part_h,highest).
	}
	return highest.
}

function entryETA {
	print "ETA check.".
	local timecheck is 0.
	if verticalspeed > 0 set timecheck to time:seconds + ETA:apoapsis.
	else set timecheck to time:seconds.
	local checkAlt is apoapsis.
	
	until checkAlt <= body:atm:height {
		set timecheck to timecheck + 10.
		set checkPos to positionat(ship,timecheck).
		set checkAlt to body:altitudeof(checkPos).
	}
	
	return timecheck.
} 

function loaddist {
	parameter dist.
	// Note the order is important.  set UNLOAD BEFORE LOAD,
	// and PACK before UNPACK.  Otherwise the protections in
	// place to prevent invalid values will deny your attempt
	// to change some of the values:
	SET KUNIVERSE:DEFAULTLOADDISTANCE:FLYING:UNLOAD TO dist.
	SET KUNIVERSE:DEFAULTLOADDISTANCE:FLYING:LOAD TO dist-500.
	WAIT 0.
	SET KUNIVERSE:DEFAULTLOADDISTANCE:FLYING:PACK TO dist - 1.
	SET KUNIVERSE:DEFAULTLOADDISTANCE:FLYING:UNPACK TO dist - 1000.
	WAIT 0.

	SET KUNIVERSE:DEFAULTLOADDISTANCE:SUBORBITAL:UNLOAD TO dist.
	SET KUNIVERSE:DEFAULTLOADDISTANCE:SUBORBITAL:LOAD TO dist-500.
	WAIT 0.
	SET KUNIVERSE:DEFAULTLOADDISTANCE:SUBORBITAL:PACK TO dist - 1.
	SET KUNIVERSE:DEFAULTLOADDISTANCE:SUBORBITAL:UNPACK TO dist - 1000.
	WAIT 0.
}