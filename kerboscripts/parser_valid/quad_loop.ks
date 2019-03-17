// ### quad_loop.ks ###

@LAZYGLOBAL on.

function dummy {
	lock throttle to th.
}



function initializeTrigger { //called once by quad.ks right before flightcontroller()
	
	
	
	when focused then {
		inputs(). //check for user input 
		return true.
	}
	
	if hasGimbal { //turret stuff
		runoncepath("turret.ks").
		set tOld2 to time:seconds - 0.02.
	}
	
	when true then {
	
		set shipFacing to facing:vector.
		set shipVelocitySurface to velocity:surface.
		
		
		
		// ##############
		// ### Turret ###
		// >>
		if hasGimbal { // gimbal camera (hull cam) 
			set dT2 to max(0.02,time:seconds - tOld2).
			set tOld2 to time:seconds.
			
			set v_dif to (shipVelocitySurface - velold)/dT2.
			set velold to shipVelocitySurface.
	
			set h_acc to vxcl(upVector, v_dif).
			set v_acc to vdot(upVector, v_dif).
			
			updateGimbal().
		}
		
		return true.
	}
}

function flightcontroller {
	// <<
	if hasPort { // IS DOCKED CHECK
		local portSatus is localPort:state.
		if portSatus = "Docked (docker)" or portSatus = "Docked (dockee)" set isDocked to true.
		else set isDocked to false.
	}
	
	// ########################
	// ### THRUST AND STUFF ###
	// >>
	set totalThrust to v(0,0,0).
	set i to 0. until i = 4 { //engine vecdraws and thrust vector
		set totalThrust to totalThrust + engs[i]:facing:vector * engs[i]:thrust.
		
		if thMark {
			set engineThrustLimitList[i] to engineThrustLimitList[i] * 0.8 + (th * (engs[i]:thrustlimit/100)) * 0.2. 
			set vecs[i]:VEC to engs[i]:facing:vector * (engDist * engineThrustLimitList[i]).
			set vecs[i]:START to engs[i]:position.
		}
		set i to i + 1.
	}
	// <<
	
	//engs along starvec: roll
	//engs along topvec:  pitch
	
	
	
	
	// #################
	// ### SLOW TICK ###
	// >>
	 
	if time:seconds > slowTimer + 1 or (forceUpdate and not(isDocked)) {
		if KUniverse:activevessel = ship and not(focused) {
			set focused to true.
		}
		else if not(KUniverse:activevessel = ship) and focused {
			set focused to false.
		}
		
		set slowTimer to time:seconds.
		set forceUpdate to false.
		
		set fuel to round((droneRes:amount/droneRes:capacity)*100).
		
		if not(isDocked) {
			set upVector to up:vector.
			set gravityMag to body:mu / body:position:sqrmagnitude.
			set gravity to -upVector * gravityMag.
		
			set maxThr to ship:maxthrustat(1).
			set maxTWR to maxThr / adjustedMass.
			set TWR to maxTWR/9.81.
		
			set weightRatio to gravityMag/9.81.
			set adjustedMass to mass + massOffset.
			
			
			
			//max tilt stuff
			if hasGimbal set maxNeutTilt to 60.
			else set maxNeutTilt to arccos(gravityMag / maxTWR). 
			
			if hasGimbal {
				set curMaxVAcc to vdot(upVector,angleaxis(maxNeutTilt,vcrs(upVector,north:vector)) * (upVector * maxTWR)).
				set maxHA to sin(maxNeutTilt) * maxTWR * (gravityMag / curMaxVAcc).
			}
			
			else set maxHA to sin(maxNeutTilt) * maxTWR.
			
			if shipVelocitySurface:mag < 80 set sampleInterval to 0.2.
			else set sampleInterval to 0.1.
		}
		
	} // << ### end of SLOW TICK
	
	set throt to totalThrust:mag/maxThr.
	set maxTWRVec to shipFacing * maxTWR.
	//set availableTWR to availableTWR * 0.95 + 0.05 * (ship:availablethrust / adjustedMass).
	
	// ##################################
	// ### Fuel stuff and autodocking ###
	// >>
	if hasPort {
		if (fuel < 30 or brakes) and charging = false and isDocked = false and (autoFuel or brakes) and (mode <> m_race or gateI = 0) {
			brakes off.
			setLights(1,0.2,0.2).
			set targetPort to ship:rootpart.
			set lowDist to 50000.
			list targets in targs.
			local targetChargeVeh is ship.
			for cur_vehicle in targs {
				if cur_vehicle:position:mag < lowDist {
					local hasFuel is false.
					for res in cur_vehicle:resources {
						if res:name = fuelType {
							if res:capacity > droneRes:capacity set hasFuel to true.
						}
					}
					if hasFuel {
						local ports is cur_vehicle:partstagged("R").
						for port in ports {
							if port:position:mag < lowDist and port:state = "Ready" and not(port:tag = "X") and port:name = localPort:name
							{
								//if vang(upVector,port:facing:vector) < 20 {
									set targetPort to port.
									set targetChargeVeh to cur_vehicle.
									set lowDist to port:position:mag.
								//}
							}
						}
					}
				}
			}
			if not(targetPort = ship:rootpart) and not(targetChargeVeh = ship) { //found a valid port
				set old_mode to mode.
				set old_submode to submode.
				set old_pos to targetGeoPos.
				if old_submode = m_follow { set old_tarVeh to tarVeh. set old_tarPart to tarPart. }
				set old_followDist to followDist.
				set followDist to 0.
				set mode to m_follow.
				set submode to m_follow.
				set doLanding to false.
				set tarVeh to targetChargeVeh.
				
				local aimPoints is tarVeh:partstagged("aimPoint").
				if aimPoints:length > 0 {
					set tarPart to aimPoints[0].
					set aimPoint to true.
					
					set PID_pitch:kp to 35.
					set PID_roll:kp to 35.
					
					tarVeh:connection:sendmessage("dock").
				}
				else {
					set tarPart to targetPort.
					set aimPoint to false.
				}
				//set tarPart:tag to "X".
				set charging to true.
				if fuel < 25 {
					entry("WARNING: Low on power!").
					warning("WARNING: Low on power!").
				}
				entry("Autodocking to nearby port..").
				popup("Autodocking to nearby port..").
				setLights(1,1,0).
			}
		}
		if isDocked {
			
			set fuel to round((droneRes:amount/droneRes:capacity)*100).
			
			if charging { //first tick as docked
				unlock throttle.
				for ms in core:part:modules { //for some reason terminal sometimes closes on dock
					set m to core:part:getmodule(ms).
					if m:hasaction("Open Terminal") m:doevent("Open Terminal").
				}
				
				set minimumDockTime to time:seconds + 6.
				
				local deployed is false.
				for eng in engs {
					set eng:thrustlimit to 0.
					eng:shutdown.
					for moduleStr in eng:modules {
						local mod is eng:getmodule(moduleStr).
						if mod:hasevent("Retract Propeller") { mod:doevent("Retract Propeller"). set deployed to true. }
					}
					
				}
				//if deployed wait 2.
				
				//dronePod:controlfrom.
				for elm in ship:elements { if elm:name = tarVeh:name set bank to elm. }
				set transferOrder to transferall(fuelType, bank, core:element).
				set transferOrder:active to true.
				set charging to false.
				wait 0.
				//set targetPort:tag to "R".
				entry("Docked, recharging..").
			}
			if (fuel > 99 or autoFuel = false) and forceDock = false and time:seconds > minimumDockTime {
				setLights(0,1,0).
				set transferOrder:active to false.
				wait 0.
				localPort:undock.
				wait 0.1.
				tarVeh:connection:sendmessage("undock").
				
				set forceUpdate to true.
				set freeSpeed to 0.
				set mode to old_mode.
				set submode to old_submode.
				if old_submode = m_follow {
					set tarVeh to old_tarVeh.
					set followDist to old_followDist.
					set tarPart to old_tarPart.
				}
				else set targetGeoPos to old_pos.
				entry("Undocking.").
				
				kuniverse:forceactive(ship).
				dronePod:controlfrom.
				
				local deployed is false.
				for eng in engs {
					for moduleStr in eng:modules {
						local mod is eng:getmodule(moduleStr).
						if mod:hasevent("Deploy Propeller") { mod:doevent("Deploy Propeller"). set deployed to true. }
					}
				}
				if deployed wait 1. 
				
				for eng in engs {
					eng:activate.
					set eng:thrustlimit to 100.
				}
				
				set th to 0. set lockToggle to true.
				
				set PID_pitch:kp to 75.
				set PID_roll:kp to 75.
				
				set vecs[markHorV]:START to v(0,0,0). 
				set vecs[markDesired]:START to v(0,0,0).
				//set vecs[markAcc]:START to v(0,0,0). 
				set vecs[markTar]:START to v(0,0,0).
				for ms in core:part:modules {
					set m to core:part:getmodule(ms).
					if m:hasaction("Open Terminal") m:doevent("Open Terminal").
				}
			}
			
		}
		else if charging and brakes { //abort dock
			brakes off.
			set charging to false.
			setLights(0,1,0).
			popup("Cancelling docking..").
			tarVeh:connection:sendmessage("abort").
			
			set forceUpdate to true.
			set freeSpeed to 0.
			set mode to old_mode.
			set submode to old_submode.
			if old_submode = m_follow {
				set tarVeh to old_tarVeh.
				set followDist to old_followDist.
				set tarPart to old_tarPart.
			}
			else set targetGeoPos to old_pos.
		}
	} // << ### end of fuel stuff
	
	if not(isDocked) {
		// ########################
		// ### VARS AND TARGETS ###
		// >>
		set v_vel to verticalspeed.
		set v_vel_abs to abs(v_vel).
		set h_vel to vxcl(upVector,shipVelocitySurface).
		set h_vel_mag to h_vel:mag.
		
		
		if submode = m_follow or (submode = m_land and charging) {
			set relativeV to vxcl(upVector,tarVeh:velocity:surface) - h_vel.
			
			if tarVeh:loaded {
				if tarPart = ship:rootpart { taggedPart(). }  //target just got into range, look for part
				set targetPart to tarPart.
				if not(targetPart:ship = tarVeh) set tarVeh to targetPart:ship. //in case of docking/undocking, update vessel 
			}
			else { set targetPart to tarVeh. }
			set targetGeoPos to body:geopositionof(targetPart:position).
			set targetPos to targetPart:position.
			
			//autodock
			if charging and submode = m_follow and not aimPoint {
				if vxcl(upVector, targetPos):mag < 0.3 and relativeV:mag < 0.1 and v_vel_abs < 1 and abs(altErr) < 1 {
					set mode to m_land.
					set submode to m_land.
				}
			}
		} 
		else if submode = m_hover or submode = m_free set targetGeoPos to ship:geoposition.
		else if mode = m_race {
			set targetGatePos to targetGate:position.
			set gateDistVec to vxcl(upVector,targetGatePos).
			set gateDist to gateDistVec:mag.
			
			set gateFacing to vxcl(upVector,targetGate:facing:vector):normalized.
			set gateFacingAtMax to angleaxis(maxApproachAngle, upVector) * gateFacing.
			
			//is the drone in the approach angle cone?
			if vang(gateDistVec,gateFacing) < abs(maxApproachAngle) and vang(gateDistVec,gateFacingAtMax) < abs(maxApproachAngle) set tempFacing to gateDistVecOld:normalized.
			//if not, what edge is it closest to?
			else if vang(gateDistVec,gateFacing) > vang(gateDistVec,gateFacingAtMax) set tempFacing to gateFacingAtMax.
			else set tempFacing to gateFacing. 
				
			set gateDistVecOld to gateDistVec.
			
			set gateSideVec to vcrs(upVector,tempFacing):normalized. 
			if vang(gateSideVec,-gateDistVec) < 90 set gateSideVec to -gateSideVec. //pointing towards the center line  
			set side_dist to abs(vdot(gateSideVec,gateDistVec)).
			
			if gateCorner set gateOffset to min(25,side_dist/2). // - h_vel_mag/4.
			else set gateOffset to min(350,side_dist/1.5). // - h_vel_mag/4.
			set targetPos to targetGatePos + (tempFacing * -gateOffset).
			
			set targetGeoPos to ship:body:geopositionof(targetPos).
			set targetPos to targetGeoPos:position.
			
			set sideVec to vcrs(h_vel,upVector):normalized. 
			
			//gate intersect detection and finding the next gate  
			if detectIntersect() { entry("Passed " + targetGate:name). nextGate(). }
			//set vecs[markGate]:start to targetGatePos + upVector * 50.
			
		}
		else set targetPos to targetGeoPos:position.
		
		set targetPosXcl to vxcl(upVector, targetPos).
		
		set dT to time:seconds - tOld.
		set tOld to time:seconds.
		set v_dif to (shipVelocitySurface - velold)/dT.
		set velold to shipVelocitySurface.
		
		set h_acc to vxcl(upVector, v_dif).
		set v_acc to vdot(upVector, v_dif).
		// <<
		
		// ########################
		// ### MASS CALIBRATION ###
		// >>
		if hasWinch {
			set acc_expected to totalThrust/adjustedMass + gravity.
			set v_acc_expected to vdot(upVector, acc_expected).
			//set v_acc_e_old to v_acc_expected.
			
			if shipVelocitySurface:mag < 0.5 and abs(throt - throtOld) < 0.01 { // and not(submode = m_land) {
				set v_acc_difference to  v_acc_expected - v_acc.
				set acc_list[accI] to v_acc_difference.
				if accI = 4 set accI to 0.
				else set accI to accI + 1.
				set acc_sum to 0. for acc_dif in acc_list {
					set acc_sum to acc_sum + acc_dif.
				}
				set v_acc_dif_average to acc_sum/20.
				//set adjustedMass to adjustedMass + 0.01 * v_acc_dif_average.
				set massOffset to max(-mass*0.05,massOffset + mass * 0.04 * v_acc_dif_average).
				set adjustedMass to mass + massOffset.
			}
			
			set throtOld to throt.
		}	
		// <<
		
		// #########################
		// ### TERRAIN DETECTION ###
		// >> 
		set posCheckHeight to min(altitude , ship:geoposition:terrainheight).
		
		
		if mode = m_race {
			set tAlt to max(posCheckHeight,gateHeight).
			set maxClimbAng to 0.
		}
		else {
			if lastT + sampleInterval < time:seconds { //sampleInterval is 0.2 seconds on slower speeds, lower on higher speeds
				set lastT to time:seconds.
				
				
				
				// Check height around the drone
				if groundspeed < 20 {
					set curEngPos to engs[engineCheck]:position.
					set curEngPos:mag to (curEngPos:mag * 1.25) + 8.
					set curGeo to body:geopositionof(curEngPos).
					set posCheckHeight to max(posCheckHeight,curGeo:terrainheight).
					
					if engineCheck < 3 set engineCheck to engineCheck + 1.
					else set engineCheck to 0.
				}


				//find highest point in predicted future position
				
				set predictedPos to v(0,0,0).
				set vel_at_pos to h_vel.
				set dVorig to desiredHV - vel_at_pos.
				set maxClimbAng to 0.
				set i to 1. until i > terrainChecks {
					
					set dV to desiredHV - vel_at_pos.
					set predictedAcc to (dV:normalized * h_acc:mag) * min(1,max(0.01,(dV:mag/dVorig:mag))).
					set predictedPos to predictedPos + vel_at_pos + 0.5 * predictedAcc.
					set vel_at_pos to vel_at_pos + predictedAcc.
					
					set curGeo to body:geopositionof(predictedPos).
					set curGeoHeight to curGeo:terrainheight.
					
					if terMark {
						set terPos to curGeo:position.
						set pm to pList[i].
						set vecs[pm]:start to terPos.
						set vecs[pm]:vec to upVector * tHeight.
					}
					
					if curGeoHeight > posCheckHeight {
						set posCheckHeight to curGeoHeight.
					}
					
					set maxClimbAng to max(maxClimbAng,90 - vang(upVector,curGeo:position + upVector * tHeight)). //how steep we need to climb to not collide
					
					set i to i + 1.
				}

			
			// store / access last 10 highest heights - use highest 
				set posList[posI] to posCheckHeight.
				set highPos to posCheckHeight.
				for p in posList {
					set highPos to max(highPos,p).
				}
				set posI to posI + 1.
				if posI = 10 set posI to 0.
			}
		
			if targetPosXcl:mag < 800 set posCheckHeight to max(posCheckHeight,targetGeoPos:terrainheight).
			
			set tAlt to max(0,max(posCheckHeight, highPos)).
			if submode = m_follow and targetPosXcl:mag < 2000 {
				if charging and aimPoint set tAlt to max(tAlt,tarVeh:altitude - tHeight - 5 - min(10,max(0,targetPosXcl:mag - 1))). 
				else set tAlt to max(tAlt,tarVeh:altitude).
			}
		}
		
		set tAlt to max(minAlt,tAlt + tHeight).
		set altErr to tAlt - altitude. //negative = drone above target height
		set altErrAbs to abs(altErr).
		// <<
		
		// #####################################
		// ### DesiredVV (vertical velocity) ###  
		// >>
		set tilt to vang(upVector,shipFacing).
		
		set acc_freefall to gravityMag * gravitymod. // the larger the modifier the more overshoot & steeper climb
		//set acc_thr to (vdot(upVector, availableTWRVec) - gravityMag) * thrustmod. 
		set acc_maxthr to (maxTWR - gravityMag) * thrustmod. 
		
		if altErr < 0 set max_acc to acc_maxthr.
		else set max_acc to acc_freefall.
		
		//set burn_duration to v_vel_abs/abs(max_acc). //fix  
		//set burn_distance to (v_vel * burn_duration) + (0.5 * max_acc * (burn_duration^2)). //fix  
		
		local driftDist is min(0,(tilt/90) * v_vel) * 0.5. 
		
		if altErr > 0 { //below target alt
			set desiredVV to sqrt( 2 * (max(0.01,altErrAbs - v_vel * climbDampening) ) * max_acc ). //sqrt( 2 * (altErrAbs^0.9) * max_acc ).
			set desiredVV to max(desiredVV, tan(maxClimbAng) * h_vel_mag * 1.5). //make sure we climb steep enough 
		}
		else { //above
			set desiredVV to sqrt( 2 * max(0.1,altErrAbs + driftDist + v_vel*0.12) * max_acc ). 
			//set desiredVV to  sqrt( 2 * (altErrAbs * 0.9) * max_acc ).
			set desiredVV to -desiredVV.
		}
		
		
		if submode = m_land and (h_vel_mag < 0.3 or not(ship:status = "FLYING")) {
			if not(charging) { set desiredVV to min(-0.5,-sqrt( 2 * max(0.001,alt:radar-2) * acc_maxthr * 0.1 )). }
			else if charging { set desiredVV to vdot(upVector, tarPart:position - localPort:position) / 2. } 
		}
		else if altErrAbs < 1 set desiredVV to altErr*2.
		if submode = m_follow {
			if charging and aimPoint and targetPosXcl:mag < 30 set desiredVV to min(1.5,desiredVV) + tarVeh:verticalspeed.
			else set desiredVV to desiredVV + tarVeh:verticalspeed.
		}
		set stVVec to desiredVV - v_vel.
		//if altErrAbs < 1 and not(altErr > 0 and v_vel < 0) set stVVec to altErr - v_vel. 
		
		
		//set dvv_error to vecdraw(v(0,0,0),upVector * stVVec/2,rgba(0.5,0.5,0,1),round(stVVec,1),1,true,0.2). 
		// <<
		
		// ########################################
		// ### DesiredHV (horizontal velocity) ####
		// >>
		
		formationComUpdate().
		
		//set speedlimit to min(speedlimitmax,30*TWR).
		
		if submode = m_free {
			set targetPosXcl to heading(freeHeading,0):vector * 10000.
			set speedlimit to freeSpeed.
		}
		else if submode = m_follow or (submode = m_land and charging) { 
			set targetPosXcl:mag to targetPosXcl:mag - followDist.
			set speedlimit to speedlimitmax.
		}
		else if mode = m_patrol set speedlimit to freeSpeed.
		else set speedlimit to speedlimitmax.
		
		
		
		if submode = m_follow or (submode = m_land and charging) { 
			
			if (time:seconds - formationLastUpdate < 0.5) {
				set targetV to formationTarget[1].
				set targetPosXcl to vxcl(upVector, targetPos) + formationTarget[2].
				
			}
			else {
				set tarVel to vxcl(upVector,tarVeh:velocity:surface).
			
				set targetV to tarVel.
			}
		}
		else set targetV to v(0,0,0).
		
		
		if mode = m_race {
			set desiredHV to targetPosXcl:normalized * 250. 
		}
		else if submode = m_land and not(charging) set desiredHV to v(0,0,0).
		else if submode = m_follow and targetPosXcl:mag < 10 and not charging {
			set rotationOffset to vcrs(targetPos,upVector):normalized.
			//set targetPosXcl to targetPosXcl + rotationOffset * (vxcl(upVector,targetPos):mag *  max(0 , 1 - targetPosXcl:mag / 10)).
			
			set desiredHV to targetV + targetPosXcl:normalized * (targetPosXcl:mag^0.8) * (1 + (TWR - 4)/8).
			if followDist > 1 {
				if rotateSpeed > 0 set desiredHV to desiredHV - rotationOffset * rotateSpeed * max(0 , 1 - targetPosXcl:mag * 0.1). //circling
				//else 
			}
		}
		else if targetPosXcl:mag > 15 {
			if submode = m_follow set approachSpeed to vdot(targetPosXcl:normalized,h_vel-targetV).
			else set approachSpeed to vdot(targetPosXcl:normalized,h_vel).
			
			local maxSteeringVec is angleaxis(-maxNeutTilt, vcrs(upVector,targetPosXcl)) * upVector.
			//set v2 to vecdraw(v(0,0,0),maxSteeringVec * 4,magenta,"maxHa: " + round(maxHA,1),1,true,0.2).
			local angSteerError is vang(shipFacing,maxSteeringVec).

			set desiredHV to targetV + targetPosXcl:normalized * sqrt( 2 * max(0.01,targetPosXcl:mag - max(0.5,angSteerError/(maxNeutTilt*2)) * approachSpeed * 2) * (maxHA^0.95)). 
		}
		//else if targetPosXcl:mag > 20 set desiredHV to targetV + targetPosXcl:normalized * (targetPosXcl:mag^0.8) * (1 + (TWR - 4)/10). 
		else set desiredHV to targetV + targetPosXcl:normalized * (targetPosXcl:mag^0.85) * 0.6. 
		//else set desiredHV to targetV + targetPosXcl:normalized * (targetPosXcl:mag^0.8) / (6/TWR). 
		
			
		if mode = m_race {
			//vars: gateFacing,tempFacing,gateSideVec,targetGate,nextTargetGate,maxApproachAngle,gateSpeed,gateHeight,gateLeft,gateRight,gateCorner 
			
			local curSideSpeed is vdot(gateSideVec,h_vel).
			local curForwardSpeed is vdot(tempFacing,h_vel).
			
			
			local front_dist is vdot(tempFacing,gateDistVec).
			//local cur_side_acc is vdot(gateSideVec,shipFacing) * maxHA. 
			local side_acc is maxHA * 0.95 * min(1,max(0.5,(side_dist)/20)) * min(1,10/(TWR+5)).   //maxHA * 0.85 * min(1,max(0.5,(side_dist)/50)) * min(1,10/(TWR+5)).
			set side_acc to side_acc / max(1,min(2,altErrAbs/8)).  
			
			//find the steering vector where acceleration is at max  
			local maxSteeringVec is angleaxis(90 - maxNeutTilt, vcrs(upVector,gateSideVec)) * -gateSideVec. //angleaxis(90 - maxNeutTilt, -vcrs(upVector,-gateSideVec)) * -gateSideVec.
			local angSteerError is vang(shipFacing,maxSteeringVec).
			local adjustedDist is max(1,side_dist - (angSteerError/(2*maxNeutTilt)) * curSideSpeed * 1.5).
			
			local targetSideSpeed is min(side_dist^1.5,sqrt(2*max(0.01,adjustedDist - curSideSpeed*0.15)*side_acc)). //min(side_dist^1.5,sqrt(2*(adjustedDist^0.9)*side_acc)). 
			local side_acc_duration is max(0.01,targetSideSpeed/side_acc).
			
			if curSideSpeed < 0 { //drone is currently moving away from center line 
				set side_acc_duration to side_acc_duration + abs(curSideSpeed)/side_acc.
			}
			//local side_acc_distance is (curSideSpeed * side_acc_duration) + (0.5 * side_acc * (side_acc_duration^2)).
			
			local behindGate is false. 
			if vdot(gateFacing,-gateDistVec) > 0 { //drone is behind the gate  
				set behindGate to true.
				//local aimPos is gateDistVec - gateSideVec * 16. //aim for 16m to the side of the gate
				local offsetGateSide is vcrs(upVector,gateDistVec):normalized.
				if vdot(gateSideVec,offsetGateSide) < 0 set offsetGateSide to -offsetGateSide.
				local aimPos is gateDistVec - offsetGateSide * 16.
				//local aimSideDist is vxcl(gateFacing,aimPos):mag.
				set desiredHV to aimPos:normalized * min(140,10 + sqrt(2* max(0.1,aimPos:mag - max(1,vdot(aimPos:normalized,h_vel))) * (maxHA*0.8))^0.95).
			}
			else { //in front of gate
				set targetFrontSpeed to max(gateSpeed, gateSpeed + sqrt(2 * max(0.01,front_dist - abs(curForwardSpeed*0.5)) * (maxHA * 0.25))).
				set targetFrontSpeed to min(targetFrontSpeed,250). 
				
				if side_dist > 6.5 {
					local forwardLimit is tan(vang(gateSideVec,desiredHV)) * max(5,targetSideSpeed).
					if vdot(desiredHV,tempFacing) < 0 set forwardLimit to -forwardLimit.
					set targetFrontSpeed to min(targetFrontSpeed,forwardLimit).
				}
				
				//set targetFrontSpeed to min(targetFrontSpeed,max(40,max(1,front_dist)^1.2)/(side_acc_duration*2)). 
				
				set targetFrontSpeed to min(targetFrontSpeed,(front_dist - 15) * 0.25 + 300 / max(1,(altErrAbs-1.5)*2)). //height error based limit
				
				//local approachAng is min(90,vang(tempFacing,h_vel)).
				//set targetFrontSpeed to min(targetFrontSpeed, max(40,front_dist) / (approachAng/10)).  
				
				//set desiredHV:mag to 150.
			

				//### desiredHV vector split into two components then merged again ###  
				
				//local desiredHVfront is tempFacing * min(targetFrontSpeed,vdot(tempFacing,desiredHV)).
				local desiredHVfront is tempFacing * targetFrontSpeed.
				
				//local desiredHVside is gateSideVec * min(targetSideSpeed,vdot(gateSideVec,desiredHV)).  
				local desiredHVside is gateSideVec * targetSideSpeed.
				
				set desiredHV to desiredHVfront + desiredHVside.
			}
		
			
			//### stVec stuff, how the two axes are prioritized etc ### 
			set stVec to desiredHV - h_vel.
			
			
			if vdot(tempFacing,stVec) > 0 and not(behindGate) {
				//prioritize side acceleration as we get closer to the gate
				local forwardFactor is max(0.15,targetGatePos:mag/800). //increase side priority as we get closer 
				set forwardFactor to max(forwardFactor,1 - abs(curSideSpeed/(TWR*2))). //but increase it up to full if we're already aimed
				set forwardFactor to min(forwardFactor,0.9).
				set stVec to vxcl(tempFacing,stVec) * 1.5 + tempFacing * vdot(tempFacing,stVec) * forwardFactor.
			}
			
			//set stVec to tempFacing * vdot(tempFacing,stVec) + gateSideVec * vdot(gateSideVec,stVec) * (1 + min(0.0,side_dist/50)).   
			
			//### Debug ###
			//set v1 to vecdraw(v(0,0,0) + h_vel/2,stVec/2,green,"",1,true,0.2). //stvec
			//set v2 to vecdraw(v(0,0,0),maxSteeringVec * 4,magenta,"",1,true,0.2).
			
			//local gateVecdrawPos is ship:body:geopositionof(targetGatePos):position + upVector * 0.3.
			//set v3 to vecdraw(gateVecdrawPos - gateFacing * 1000,gateFacing*2000,rgba(1,1,1,0.5),"",1,true,1). //mid line
			//set v4 to vecdraw(gateVecdrawPos,-gateFacingAtMax*1000,rgba(1,1,1,0.5),"",1,true,1). //max approach ang line
			//set vec_tempFacingLine to vecdraw(gateVecdrawPos,-tempFacing*1000,rgba(1,0,0,1),"",1,true,1.2). //cur approach ang line 
			//set vec_targetPos to vecdraw(targetPos + upVector * 4,-upVector*4,rgba(1,1,0,1),"",1,true,2).
			//set vec_altErr to vecdraw(v(0,0,0),upVector*altErr,rgba(1,1,0,0.5),"",1,true,0.2).
				
		}
		else { //all other modes 
			set desiredHV:mag to min(speedlimit,desiredHV:mag).
			
			set stVec to desiredHV - h_vel.
			if mode = m_follow and rotateSpeed > 0 and not charging and targetPosXcl:mag < 10 {
				if vang(stVec,vxcl(upVector,targetPos)) < 90 {
					set stVec to stVec + vxcl(rotationOffset,stVec) * 4. //priority to keeping distance when circling
				}
			}
			else set stVec to stVec + max(0,(h_vel_mag - 100) / 50) * vxcl(desiredHV,stVec). //focus on closing down sideslip as velocity goes above 100
		}
		
			
		if mode = m_follow { //and charging 
			//error adjustment
			if targetV:mag > 10 {
				if h_acc:mag < 0.5 and (h_vel - targetV):mag < 1 {
					set vMod to max(0, vMod + max(-2,min(2,vdot(desiredHV:normalized,stVec))) * 0.1 ).
				}
				set stVec to stVec + targetV:normalized * vMod. 
			}
			set vecs[markVMod]:vec to targetV:normalized * vMod.

			
			
			//EO error adjustment
			if vecs[markDesired]:show {
				set vecs[markVMod]:start to desiredHV/2.
				if vecs[markVMod]:show = false set vecs[markVMod]:show to true.
			}
			else if vecs[markVMod]:show set vecs[markVMod]:show to false.
			
			
		}
		//
			
		// <<
		
		// ##########################################
		// ### Formation Communications Broadcast ###
		
		if isLeading {
			formationBroadcast(4,desiredHV,h_vel:normalized * -15).
		}
		
		// ######################################## 
		// ### targetVec & desired acceleration ###
		// >>
		
		set desiredHAcc to stVec.
		set PID_hAcc:maxoutput to maxTWR.
		set desiredHAcc:mag to PID_hAcc:update(time:seconds, -stVec:mag).
		
		set PID_vAcc:maxoutput to maxTWR.
		
		//if mode = m_race or mode = m_follow set PID_vAcc:minoutput to -maxTWR - gravityMag.
		//else set PID_vAcc:minoutput to -gravityMag * 0.90.
		set PID_vAcc:minoutput to -maxTWR - gravityMag.
		
		set desiredVAccVal to PID_vAcc:update(time:seconds, -stVVec).
		
		
		if desiredVAccVal < -gravityMag { 
			//if mode = m_pos set desiredVAccVal to -gravityMag.
			set desiredVAccVal to -gravityMag + (desiredVAccVal + gravityMag)/8. //  /4
		}
		
		set desiredVAcc to upVector * desiredVAccVal.
		
		set verticalAcc to desiredVAcc - gravity.
		set desiredAccVec to desiredHAcc + verticalAcc.
		// need to cap the horizontal part
		if desiredAccVec:mag > maxTWR  {
			if (desiredVAccVal + gravityMag) > maxTWR { //if verticalAcc:mag > maxTWR {
				
				set desiredAccVec to verticalAcc + desiredHAcc * 0.25. // * (2/max(2,altErrAbs)). 
				//set desiredAccVec to verticalAcc:normalized * maxTWR + desiredHAcc:normalized * maxTWR * 0.25. // + desiredHAcc:normalized * maxTWR * 0.25. //do some sideacc as well
				
				//set desiredHAcc:mag to vdot(desiredHAcc:normalized,desiredAccVec).
				
				//set desiredHAcc:mag to 0.
			}
			else if desiredVAccVal > 0 { //need to cap it, but can still do some of it 
				// total^2 = vert^2 + hor^2
				// hor = sqrt(total^2 - vert^2)
				set desiredHAcc:mag to sqrt((maxTWR^2) - (verticalAcc:mag^2)).
				set desiredAccVec to verticalAcc + desiredHAcc.
			}
		}
		
		
		
		set targetVec to desiredAccVec:normalized.
		
		if submode = m_hover set targetVec to upVector.
		else if submode = m_land and not(charging) set targetVec to (upVector * 5 + (upVector - (h_vel/2))):normalized.
		
		
		// ### Tilt Cap ###
		
		set targetVecTilt to vang(upVector,targetVec). 
		if hasGimbal set tiltCap to min(vang(upVector,desiredHAcc - gravity),60). 
		else set tiltCap to (desiredHAcc:mag / maxTWR) * 600. // 600
		
		if targetVecTilt > tiltCap and (altErr > -20 or mode = m_pos or doLanding or hasGimbal) { //cap tilt
			set rotAx to -vcrs(targetVec, upVector).
			set targetVec to upVector.
			set targetVec to angleaxis(tiltCap, rotAx) * targetVec.
		}
		
		if doFlip {
			set rotAx to vcrs(h_vel, upVector).
			set targetVec to angleaxis(90, rotAx) * vxcl(rotAx,shipFacing).
		}
		
		updateVec(targetVec).
		// <<
		
		// ################
		// ### Throttle ###
		// >>
		set curMaxVAcc to vdot(upVector,maxTWRVec).
		set thMid to gravityMag / curMaxVAcc. //the throttle to keep vertical acceleration at 0 with the current tilt
		if curMaxVAcc < 0.0001 set thMid to 1.
		
		//set throttle so desired vertical acc is achieved 
		set th to vdot(upVector,verticalAcc) / max(0.01,curMaxVAcc).
		
		local angleErrorMod is max( 0.1 , vdot(shipFacing,targetVec) ).
		//if mode = m_race set th to max( th ,((angleErrorMod^2) * 0.5 * desiredHAcc:mag) / maxTWR ).
		//set th to max( th ,min( thMid * 0.95 , (angleErrorMod * desiredHAcc:mag) / maxTWR ) ). 

		//set th to (desiredAccVec:mag * angleErrorMod) / maxTWR.
		if tilt > 90 set th to max(gravityMag * 2 / maxTWR, (angleErrorMod * desiredHAcc:mag) / maxTWR ).
		
		set th to max(0.01,min(1,th)).
		// << 

		// ######################## 
		// ### engine balancing ###
		// >>
		
		set pitch_err to toRad(vang(shipFacing, targetVecTop)).
		set roll_err to toRad(vang(shipFacing, targetVecStar)).
		
		set pitch_acc to (pitch_torque * (thMid^0.5) * 0.15) / pitch_inertia. //(pitch_torque * thMid * 0.30) / pitch_inertia. 
		set roll_acc to (roll_torque * (thMid^0.5) * 0.15) / roll_inertia. //(roll_torque * thMid * 0.30) / roll_inertia. 
		
		set pitch_vel_target to ( 2 * pitch_err * pitch_acc)^0.5.
		set roll_vel_target to ( 2 * roll_err * roll_acc)^0.5.

		
		
		if vdot(facing:topvector, targetVecTop) < 0 set pitch_vel_target to -pitch_vel_target.
		if vdot(facing:starvector, targetVecStar) < 0 set roll_vel_target to -roll_vel_target.
		
		set angVel to ship:angularvel.
		set pitch_vel to -vdot(facing:starvector, angVel).
		set roll_vel to vdot(facing:topvector, angVel).
		
		
		if hasGimbal { //camera drone
			set pitch_vel_target to pitch_vel_target * 0.6.
			set roll_vel_target to roll_vel_target * 0.6.
		}
		else if doFlip {
			set pitch_vel_target to pitch_vel_target * 5.
			set roll_vel_target to roll_vel_target * 5.
		}
		
		if vang(targetVec,shipFacing) > 5 or max(abs(pitch_vel),abs(roll_vel)) > 0.2 set th to max(th,thMid * 0.5). //give a bit of extra power to steer when needed.
		set throt to max(0.01,th).
		
		set PID_pitch:setpoint to pitch_vel_target.
		//set pitch_distr to PID_pitch:update(time:seconds, pitch_vel) / throt.
		set pitch_distr to PID_pitch:update(time:seconds, pitch_vel) / th. // / throt.
		
		set PID_roll:setpoint to roll_vel_target.
		//set roll_distr to PID_roll:update(time:seconds, roll_vel) / throt.
		set roll_distr to PID_roll:update(time:seconds, roll_vel) / th. // / throt.
		
		set eng_pitch_pos["part"]:thrustlimit to 100 + pitch_distr.
		set eng_pitch_neg["part"]:thrustlimit to 100 - pitch_distr.
		set eng_roll_pos["part"]:thrustlimit to 100 + roll_distr.
		set eng_roll_neg["part"]:thrustlimit to 100 - roll_distr.
		
		//since steering reduces effective thrust, up the throttle to match the intended thrust
		local thrustDuringSteering is (400 - min(100,abs(pitch_distr)) - min(100,abs(roll_distr)))/400.
		set th to min(1,th / thrustDuringSteering).
		
		if doFlip and tilt < 120 set th to 1.
		
		// <<
		
		// ###################### 
		// ### Some overrides ###
		// >>
		if mode = m_patrol {
			if vxcl(upVector,(ship:geoposition:position - targetGeoPos:position)):mag < max(2,min(10,patrolRadius/10)) {
				set rotAx to upVector.
				set newPosition to vxcl(upVector, shipFacing):normalized.
				set newPosition:mag to (patrolRadius/3) + (random() * patrolRadius * (2/3)).
				set newPosition to angleaxis(random() * 360, rotAx) * newPosition.
				set newPosition to patrolGeoPos:position + newPosition.
				set targetGeoPos to body:geopositionof(newPosition).
			}
		}
		else if doLanding {
			set freeSpeed to 0.
			if h_vel_mag < 1 and abs(altErr) < 3 and abs(v_vel) < 0.5 { 
				set submode to m_land. set mode to m_land. set doLanding to false.
				for m in gearMods {
					if m:hasaction("extend/retract") m:doaction("extend/retract",true).
				}
			}
		}
		// <<
		
		// ######################
		// ### Vecdraws mmMMm ###
		// >>
			
		if vecs[markDestination]:show {
			if mapview {
				local upAtPosition is (targetPos-body:position):normalized.
				local destinationVecLength is body:radius / 10.
				set vecs[markDestination]:vec to upAtPosition * -destinationVecLength.
				set vecs[markDestination]:start to targetPos + upAtPosition * destinationVecLength.
				set vecs[markDestination]:width to 0.3 * (body:radius / 600000).
			}
			else {
				local destinationVecLength is max(3,(1 + targetPos:mag)^0.5).
				set vecs[markDestination]:vec to upVector * -destinationVecLength.
				set vecs[markDestination]:start to targetPos + upVector * destinationVecLength.
				set vecs[markDestination]:width to max(0.2,-1 + (max(1,targetPosXcl:mag) ^ 0.25)).
				//set vecs[markDestination]:label to " " + round(vecs[markDestination]:width,1).
			}
		}
		
		//if miscMark set vecs[markAcc]:VEC to v_dif/2.
		if stMark or submode = m_free { 
			set vecs[markHorV]:vec to h_vel/2.
			set vecs[markDesired]:vec to desiredHV/2.
		}
		
		//set vecs[markStar]:vec to facing:starvector*4.
		//set vecs[markTop]:vec to facing:topvector*4.
		//set vecs[markFwd]:vec to facing:forevector*4.
		// <<
		
		// ################
		// ### Terminal ###
		// >>
		set dTavg to dTavg * 0.95 + dT * 0.05.
		set title_hz:text to round(1/dTavg) + "hz".
		
		if box_all:visible {
			if box_right:visible {
				set g_speedlimit:text to round(speedlimit):tostring().
				set g_groundpspeed_label_val:text to round(h_vel_mag) + "m/s".
				set g_radar_label_val:text to round(alt:radar) + "m".
				set g_height_error_label_val:text to round(altErr,1)+ "m".
			
			}
			
			if submode = m_free {
				set g_free_speed_label_val:text to round(freeSpeed,1) + " m/s".
				set g_free_heading_label_val:text to round(freeHeading,1):tostring().
			}
			else if submode = m_follow {
				set g_target_distance_label_val:text to round(tarVeh:distance) + "m".
			}
			
			if time:seconds > consoleTimer + 0.5 {
				if submode = m_hover or submode = m_free { }
				else if submode = m_land { }
				else if mode = m_race { }
				else if mode = m_pos {
					local distTarget is round(targetPosXcl:mag,2).
					if distTarget > 1000 set g_pos_distance:text to "Distance: " + round((distTarget / 1000),1) + " km".
					else set g_pos_distance:text to "Distance: " + distTarget + " m".
					
					set g_pos_lat:text to "Latitude: " + round(targetGeoPos:lat,2).
					set g_pos_lng:text to "Longitude: " + round(targetGeoPos:lng,2).
					set g_pos_hdg:text to "Heading: " + round(targetGeoPos:heading,1):tostring().
				}
				
				//Stats
				set title_fuel_text:text to round(fuel) + "%".
				if fuel >= 50 set title_fuel_text:style:textcolor to rgb(0,1,0).
				else set title_fuel_text:style:textcolor to rgb(1,fuel/50,0).
				
				
				set g_TWR_label_val:text to round(TWR,2):tostring().
				set g_mass_label_val:text to round(mass,3) + "t".
				set g_payload_label_val:text to round(adjustedMass - mass,3) + "t". 
				
				//
				set consoleTimer to time:seconds.
			}
		}
		else {
			set title_fuel_text:text to round(fuel) + "%".
			if fuel >= 50 set title_fuel_text:style:textcolor to rgb(0,1,0).
			else set title_fuel_text:style:textcolor to rgb(1,fuel/50,0).
		}
		
		// << ### terminal end ###
		

		
		
		
		// <<
		
		// #############################
		// ### Yaw rotatron controls ###
		// >>
		if yawControl {
			set yawAngVel to vdot(shipFacing, angVel).
			if ship:control:pilotroll > 0 set targetRot to 25 - th * 20.
			else if ship:control:pilotroll < 0 set targetRot to -25 + (th * 20).
			else {
				if abs(yawAngVel) > 0.001 { 
					set targetRot to min(40,abs(yawAngVel) * 10 * (5/TWR) * (1.25 - th)).   
					if yawAngVel > 0 set targetRot to -targetRot.
				}
				else set targetRot to 0.
			}
			
			for s in yawRotatrons {
				s:moveto(targetRot,25).
			}
			
		} // <<
	}
	
	//keep the thing running at 25hz
	if tOld = time:seconds wait 0.03. 
	else wait 0.
}