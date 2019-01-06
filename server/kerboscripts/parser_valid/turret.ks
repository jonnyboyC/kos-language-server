run cam.

//### camera stuff ---------------------------------------------------------------------
// >>
set hasGimbal to false.
set hasCam to false.
set hasCamRoll to false.
set hasCamArm to false.
set cam to ship:partstagged("camera").
set camRotH to ship:partstagged("horizontal").
set camRotV to ship:partstagged("vertical").
if cam:length > 0 and camRotH:length > 0 and camRotV:length > 0 {
	print("Found camera and gimballing parts, enabling camera controls..").
	wait 0.2.
	set hasGimbal to true.
	set cam to cam[0].
	//if false {
		set hasCam to true.
		set camMod to cam:getmodule("MuMechModuleHullCameraZoom").
	//}
	
	set camRotH to camRotH[0].
	set rotHMod to camRotH:getmodule("MuMechToggle").
	set camRotV to camRotV[0].
	set rotVMod to camRotV:getmodule("MuMechToggle").
	rotHMod:setfield("acceleration",50). 
	rotVMod:setfield("acceleration",50).   
	
	if ship:partstagged("roll"):length > 0 {
		set camRotR to ship:partstagged("roll")[0].
		set rotRMod to camRotR:getmodule("MuMechToggle").
		set hasCamRoll to true.
		rotRMod:setfield("acceleration",20).
	}
	else set hasCamRoll to false.
	
	if ship:partstagged("arm"):length > 0 {
		set camArm to ship:partstagged("arm")[0].
		set armMod to camArm:getmodule("MuMechToggle").
		armMod:setfield("acceleration",20).
		set hasCamArm to true.
	}
	
	
	
	set frontPart to camRotV. 
}
for servo in addons:ir:allservos {
	if servo:part = camRotH set servoH to servo.
	else if servo:part = camRotV set servoV to servo.
	
	if hasCamRoll {
		if servo:part = camRotR set servoR to servo.
	}
	if hasCamArm {
		if servo:part = camArm set servoArm to servo.
	}
}
wait 0.1.
// <<

if hasGimbal { //turret stuff
	set horErrorI to 0.
	set vertErrorI to 0.
	set tarVelLast to v(0,0,0).
	set tarAcc to v(0,0,0).
	set tarAccOld to v(0,0,0).
	set accAngRot to 0.
	set accRotAxis to v(0,0,0).
	set lastCamPos to extcam:position.
	
	for p in ship:parts {
		if p:name = "bahaBrowningAnm2" {
			set turret to p.
			set muzzleVel to 890.
		}
		else if p:name:contains("vulcan") {
			set turret to p.
			set muzzleVel to 1050.
		}
		else if p:name = "bahaGau-8" {
			set turret to p.
			set muzzleVel to 980.
		}
	}
}

set camMove to 0.
//set targetLastPos to v(0,0,0).
set lastTickAtShip to true.
set tOld to time:seconds - 0.02.

set vd_target to vecdraw(v(0,0,0),v(0,0,0),magenta,"",1,true,0.4).
set vd_aim to vecdraw(v(0,0,0),v(0,0,0),green,"",1,true,0.2).
set vd_acc1 to vecdraw(v(0,0,0),v(0,0,0),green,"",1,true,0.2).
set vd_acc2 to vecdraw(v(0,0,0),v(0,0,0),yellow,"",1,true,0.2).

function updateGimbal {
	print " dt: " + dT at (0,terminal:height-6).
	
	set targetVes to ship.

	list targets in tars.
	for t in tars {
		if t:distance < 6100 and vdot(-t:position,t:velocity:surface) > -100 and ag1 {
			if t:name:startswith("Aim") or t:name:startswith("AGM") or t:name:startswith("BGM") or t:name:startswith("PAC-") {
				set targetVes to t.
				break.
			}
		}
	}

	if hastarget and targetVes = ship and target:distance < 6000 { 
		set targetVes to target.
		if targetVes:istype("Part") set targetVes to targetVes:ship.
	}
	
	if not(targetVes = ship) and ag2 {
		if lastTickAtShip {
			set lastTickAtShip to false.
			set camMove to 1.1.
			set extcam:target to targetVes.
			set extcam:position to ship:position.
		}
		
		//set extcam:position to targetVes:position * (1-camMove).
		if camMove > 0 set extcam:cameradistance to max(15,(targetVes:distance * (camMove^0.5))).
		if ag3 set extcam:heading to extcam:heading + 0.5.
		print "Missile Speed: " + round(targetVes:airspeed) + "m/s    " at (1,4).
		set camMove to max(0,camMove - 0.003 - 40/targetVes:distance).
	}
	else {
		set lastTickAtShip to true.
		set extcam:target to ship.
		if extcam:cameradistance > 50 set extcam:cameradistance to 49.
	}
	
	if hastarget or not(targetVes = ship) { //targeting code, this is where the target future position prediction happens
		
		local tarVel is targetVes:velocity:surface.
		local tarPos is targetVes:position. // + tarVel * dT. // + shipVelocitySurface * -0.02.
		set bulletSpeed to muzzleVel + vdot(tarPos:normalized,shipVelocitySurface).
		set travelTime to tarPos:mag / bulletSpeed. //(tarPos:mag^1.002) / bulletSpeed.
		
		
		set tarAcc to tarAccOld * 0 + ((tarVel - tarVelLast) / dT) * 1.
		//set vd_acc1 to vecdraw(tarPos,tarAcc,green,"",1,true,0.2).
		set tarVelLast to tarVel.
		
		local accAngRot is min(45,vang(tarAcc,tarAccOld) / dT). //how much degrees we should rotate the accel vector between steps (when the target is turning)
		local accRotAxis is vcrs(tarAccOld,tarAcc).  //the axis that we should rotate the acc vec around
		set tarAccOld to tarAcc.
		
		local tarAccTemp is angleaxis(accAngRot * travelTime * 0.33,accRotAxis) * tarAcc. //the average acceleration in a turn during the travelTime
		set tarPosNew to tarPos + tarVel * travelTime + tarAccTemp:normalized * (0.5*tarAccTemp:mag*(travelTime^2)).

		for i in Range(5) {
			set bulletSpeed to muzzleVel + vdot(tarPosNew:normalized,shipVelocitySurface).
			set travelTime to min(15, tarPosNew:mag / bulletSpeed).
			set tarAccTemp to angleaxis(accAngRot * travelTime * 0.33,accRotAxis) * tarAcc. //the average acceleration in a turn during the travelTime
			set tarPosNew to tarPos + tarVel * travelTime + tarAccTemp:normalized * (0.5*tarAccTemp:mag*(travelTime^2)).
		}
		set tarPosNew to tarPosNew + tarVel * dT - shipVelocitySurface * dT.
		//
		
		print " travelTime: " + round(travelTime,2) + " s      " at (0,terminal:height-4).
		
		set h_vel to vxcl(upVector,shipVelocitySurface).
		local heightMod is upVector * (-verticalspeed * travelTime + (0.5*9.81*(((tarPosNew:mag^1.002) / bulletSpeed)^2))). //taking gravity and initial vertical velocity of self into account
		local horMod is h_vel * -travelTime. //initial horizontal velocity  old: -(h_vel + h_acc*0.02) * travelTime.
		
		set focusPos to (tarPosNew + heightMod + horMod) - cam:position.
		
		set vd_target:start to tarPos.
		set vd_target:vec to focusPos-tarPos.
		set vd_aim:start to turret:position.
		set vd_aim:vec to turret:facing:topvector * focusPos:mag - turret:position.
		set vd_acc2:start to tarPos.
		set vd_acc2:vec to tarAccTemp.
		//set vd_aim_err to vecdraw(cam:position,turret:facing:topvector * focusPos:mag - cam:position,green,"",1,true,0.3).
		
		
		print " bullet speed: " + round(bulletSpeed) + " m/s      " at (0,terminal:height-5).
		print " height offset: " + round(heightMod:mag) + " m      " at (0,terminal:height-3).
		print " horis offset: " + round(horMod:mag) + " m      " at (0,terminal:height-2).
		print " horis error: " + round(vdot(cam:facing:starvector,focusPos) * 100) + " cm       " at (0,terminal:height-1).
	}
	//else if submode = m_follow set focusPos to tarVeh:position.
	else {
		//set focusPos to focusPos * 0.9 + (shipVelocitySurface) * 0.1.
		set focusPos to v(0,0,0).
		//set focusPos to desiredHV:normalized * 500.
	}
	
	if focusPos:mag > 1 and ag1 {
		//vertical hinge
		set vertAngleErr to vang(cam:facing:topvector,vxcl(camRotV:facing:starvector,focusPos)).
		if vdot(camRotV:facing:topvector,focusPos) < 0 set vertAngleErr to -vertAngleErr. 
		//set vertErrorI to max(-0.1,min(0.1,vertErrorI - vertAngleErr * 0.01)) .  
		servoV:moveto(rotVMod:getfield("rotation") - vertAngleErr - vdot(camRotV:facing:starvector,ship:angularvel) * (180/constant:pi) * dT,50).  
		
		//horizontal rotatron
		set horAngleErr to vang(vxcl(camRotH:facing:vector,focusPos),-camRotH:facing:topvector). 
		if vdot(camRotH:facing:starvector,focusPos) < 0 set horAngleErr to -horAngleErr.  
		set targetRot to rotHMod:getfield("rotation") - horAngleErr.
		set targetRot to targetRot - vdot(-camRotH:facing:vector,ship:angularvel) * (180/constant:pi) * dT. //compensate for angular velocity of the drone
		
		if abs(horAngleErr < 0.8) set horErrorI to max(-2,min(2,horErrorI - horAngleErr * 0.20)).
		else set horErrorI to 0.
		servoH:moveto(targetRot + 0.08 + horErrorI, 100).//min(100,abs(horAngleErr) * 1) 
		
		print "horErrorI offset: " + round(horErrorI,4) + "       " at (0,terminal:height-7).
		
		if vang(cam:facing:topvector,focusPos) < 0.3 and ag1 and focusPos:mag < 2500 rcs on.   
		else rcs off.
	}
	else {
		servoV:moveto(0,1).
		rcs off.
		//servoH:moveto(0,1).
	}
	
	if hasCamRoll {
		set rollAng to vang(upVector,vxcl( vxcl(upVector,-camRotV:facing:vector) ,-camRotH:facing:vector)).
		if vdot(camRotH:facing:starvector,upVector) > 0 set rollAng to -rollAng.
		servoR:moveto(rollAng,5).
	}
	
	if hasCamArm {
		if ag1 servoArm:moveto( ((alt:radar - 2 + vdot(upVector,cam:position))/3) * armMod:getfield("max") ,100).
		else servoArm:moveto(0,100).
	}
}