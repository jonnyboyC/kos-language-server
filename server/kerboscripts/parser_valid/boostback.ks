parameter runmode is 0, payload is ship.
set entryTime to time:seconds - 1.


clearvecdraws().
loaddist(100000). //flying and suborbital

wait until ship:unpacked.
for ms in core:part:modules { //for some reason terminal sometimes closes on dock
	set m to core:part:getmodule(ms).
	if m:hasaction("Open Terminal") m:doevent("Open Terminal").
}

print "Boostback script running.".

//local gloc is LATLNG(-0.0972098829757138, -74.557676687929). //Launchpad
//local gloc is LATLNG(-1.52807550218625,-71.8857609633566). //island runway
//local gloc is LATLNG(6.84003072705819, -62.3143155921253). //island (north) resort

//east continent:
//local gloc is LATLNG(-3.69868452018539,-40.2857948658593). //lz2
local gloc is LATLNG(-3.56930348556625,-40.2248383004123). //lz2 mnt
//local gloc is LATLNG(1.04954086727854,-42.7077262412699). //LZ-3

//west:
//local gloc is LATLNG(20.6225723742333, -146.431600245751). //ksc2 pad
//local gloc is LATLNG(22.727435661152, -120.969904966499). //lake dermal
//local gloc is LATLNG(10.6432864032526,-132.030819020903). //KKVLA

set overshoot to 300.
set targetApo to 100000.
set overshoot2 to overshoot.
set reEntryBurn to false.
local lng_diff is abs(70 + gloc:lng).
if lng_diff > 15 { 
	set targetApo to 130000.
	set overshoot2 to lng_diff * 1000.
	set reEntryBurn to true.
}

sas off.
rcs on.

local th is 0.
lock throttle to th.

kuniverse:forceactive(ship).
wait 0.
if payload <> ship set target to payload.

wait until addons:tr:hasimpact.
local st is up:vector.
//local st is heading(gloc:heading,0):vector.
lock steering to lookdirup(st,ship:facing:topvector).



set steeringmanager:pitchtorqueadjust to 0.
set steeringmanager:yawtorqueadjust to 0.

set steeringmanager:pitchts to 2.
set steeringmanager:yawts to 2.

set STEERINGMANAGER:PITCHPID:KP to 1.1.
set STEERINGMANAGER:yawPID:KP to 1.1.

if runmode = 0 {
	wait 0.
	
	set steeringmanager:maxstoppingtime to 6.

	list engines in engs.
	for eng in engs {
		//set eng:gimbal:limit to 0.
		eng:shutdown().
	}
	
	set st to vxcl(up:vector, gloc:position - addons:tr:impactpos:position):normalized + up:vector * ((targetApo - apoapsis)/ 15000).
	wait until vang(steering:vector,facing:vector) < 90.
	
	//set steeringmanager:pitchtorqueadjust to 0.
	//set steeringmanager:yawtorqueadjust to 0.
	
	
	for eng in engs {
		//set eng:gimbal:limit to 100.
		eng:activate().
	}
	//set th to 1.
}

when altitude < body:atm:height and verticalspeed < 0 then {
	wait 3.
	for m in ship:modulesnamed("ModuleAnimateGeneric") {
		if m:hasevent("deploy fins") m:doevent("deploy fins").
	}
	brakes on.
	return false.
}

set steeringmanager:maxstoppingtime to 4.
addons:tr:settarget(gloc).

set oldT to time:seconds - 0.02.
set oldV to verticalspeed.

local height_offset is estimate_height() + 5.
local th_pid is pidloop(0.3,0.1,0.001,-1,1).

set vd_hit to vecdraw(gloc:position,up:vector * 500, red, "", 1, true, 30).
set vd_tar to vecdraw(gloc:position,up:vector * 500, green, "", 1, true, 30).
set vd_error to vecdraw(v(0,0,0),v(0,0,0), yellow, "", 1, true, 0.5).

set burn_pitch to 30.
when altitude < 15000 and runmode = 1 then {
	set burn_pitch to vang(up:vector,-velocity:surface).
	print "pitch at burn start: " + round(burn_pitch,2) at (0,17).
	return false.
}

local geo_diff is v(0,0,0).
local done is false.
until done {
	if ship:status = "landed" break.
	print "dyn press: " + round(ship:q,5) + "      " at (0,9).
	
	if runmode = 0 { //boost back
		
		if addons:tr:hasimpact {
			local offset is vxcl(gloc:position-body:position,gloc:position).
			set offset:mag to overshoot2.
			local st_vec is vxcl(up:vector, offset + gloc:position - addons:tr:impactpos:position).
			set st to st_vec:normalized + up:vector * ((targetApo - apoapsis)/ 15000).
			
			if st_vec:mag < 50000 set warp to 0.
			
			local steer_error is vang(facing:vector,st) - 5.
			if steer_error < 25 set th to min(1,st_vec:mag / 15000).
			else set th to 0.
			set th to min(th,(25 - steer_error) / 25).
			
			print "dist " + round(st_vec:mag) + "          " at (0,10).
			if st_vec:mag < 200 {
				set runmode to 1.
				//if payload <> ship kuniverse:forceactive(payload). //switch to payload so it can circularize
				set th to 0.
				set st to facing:vector.
				wait until kuniverse:activevessel = ship.
			}
		}
		else {
			set st to vxcl(up:vector,-velocity:orbit).
			set th to 1.
		}
		
	}
	else if runmode = 1 {
		set th to 0.
		if alt:radar < 1200 gear on.
		if altitude < 15000 rcs off.
		
		set offset to vxcl(gloc:position-body:position,gloc:position).
		//set offset:mag to burn_pitch * 4 * min(1,max(0,velocity:surface:mag - 300)/300).
		set offset:mag to min(overshoot,vxcl(up:vector,gloc:position):mag / ((90 - vang(up:vector, -velocity:surface)) * 0.3) ). // /12
		local target_pos is gloc:position + offset.
		set target_gloc to body:geopositionof(target_pos).
		
		set vd_hit:start to addons:tr:impactpos:position.
		set vd_tar:start to target_gloc:position.
		set vd_hit:vec to up:vector * (500 + altitude / 3).
		set vd_tar:vec to up:vector * (500 + altitude / 3).
		
		
		
		
		
		if kuniverse:activevessel = ship {
			addons:tr:settarget(target_gloc).
			set posError to target_gloc:position - addons:tr:impactpos:position.
			set geo_diff to geo_diff * 0.8 + 0.2 * vxcl(target_gloc:position - body:position, posError).
			print "dist " + round(geo_diff:mag) + "          " at (0,10).
		}
		
		set vd_error:vec to geo_diff.
		
		if vang(up:vector,facing:vector) < 80 and altitude < 20000 {
			local max_acc is ship:availablethrust / ship:mass.
			local gravityMag is body:mu / (body:radius + altitude)^2.
			//local gravityVec is -up:vector * gravityMag.
			
			if throttle = 0 {
				local dt is time:seconds - oldT.
				set oldT to time:seconds.
				set accel to (verticalspeed-oldV)/dt.
				set oldV to verticalspeed.
				
				set accel to max(0,accel - gravityMag).

				print "drag acc: " + round(accel,2) + " m/s2        " at (0,20).
				
			}
			else set accel to 0.
			
			local max_v_acc is max(0.6,vdot(up:vector,facing:vector)) * max_acc - gravityMag. // + accel.
			
			//set vdist_offset to min(100,max(0,vxcl(up:vector,gloc:position):mag - 15) * 0.3).
			set vdist_offset to min(100,max(0,vxcl(up:vector,velocity:surface):mag - 2) * 0.5). //min(100,max(0,vxcl(up:vector,velocity:surface):mag - 6) * 0.5).
			//set vdist_offset to 0.
			
			set vdist to altitude - max(0,max(0,gloc:terrainheight)) - 23.2 - vdist_offset. //height_offset.
			set desiredVV to -sqrt( 2 * max(0.01,vdist + verticalspeed * 0.02) * max_v_acc ).
			
			print "vertical dist: " + round(vdist/1000,1) + " km          " at (0,11).
			print "desired v speed: " + round(desiredVV) + " m/s        " at (0,14).
			print "speed error: " + round(verticalspeed - desiredVV,1) + " m/s        " at (0,16).
			
			print "height offset: " + round(height_offset,1) at (0,18).
			
			
			if vdist > 3000 set th to 0.
			else {
				set th_pid:setpoint to min(-8,desiredVV).
				set th to 0 + th_pid:update(time:seconds,verticalspeed).
			}
			
			if verticalspeed > -2 and altitude < 10000 set th to 0.
		}
		
		// ### Steering / gliding ###
		if  (altitude > body:atm:height and verticalspeed > 0) or (verticalspeed > 0 and altitude > 10000) {
			if entryTime < time:seconds set entryTime to entryETA().
			set st to -velocityat(ship,entryTime):surface.
			print "re-entry ETA: " + round(entryTime - time:seconds) + "s       " at (0,11).
			if vang(st,facing:vector) < 6 and altitude > body:atm:height + 100 {
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
	}
	
	wait 0.
}

for m in ship:modulesnamed("ModuleAnimateGeneric") {
	if m:hasevent("retract fins") m:doevent("retract fins").
}

unlock throttle.
unlock steering.
set ship:control:pilotmainthrottle to 0.
sas on.
rcs off.

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