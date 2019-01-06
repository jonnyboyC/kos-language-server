// ### quad_loop.ks ###

@LAZYGLOBAL on.
local tOld is time:seconds - 0.02.

function dummy {
	lock throttle to th.
}



function initializeTrigger { //called once by quad.ks right before flightcontroller()
	
	
	
	//when focused then {
		inputs(). //check for user input 
	//	return true.
	//}
	
	
	when true then {
	
		set shipFacing to facing:vector.
		set shipVelocitySurface to velocity:surface.
		
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
		
		//if thMark {
		//	set engineThrustLimitList[i] to engineThrustLimitList[i] * 0.8 + (th * (engs[i]:thrustlimit/100)) * 0.2. 
		//	set vecs[i]:VEC to engs[i]:facing:vector * (engDist * engineThrustLimitList[i]).
		//	set vecs[i]:START to engs[i]:position.
		//}
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
		
		if not(isDocked) {
			
			
			set upVector to up:vector.
			set gravityMag to body:mu / body:position:sqrmagnitude.
			set gravity to -upVector * gravityMag.
			
			set weightRatio to gravityMag/9.81.
			set adjustedMass to mass + massOffset.
		
			set maxThr to ship:maxthrustat(1).
			set maxTWR to maxThr / adjustedMass.
			set TWR to maxTWR/9.81.
		
			
			
			
			
			//max tilt stuff
			set maxNeutTilt to 20.
			//else set maxNeutTilt to arccos(gravityMag / maxTWR). 
			set maxHA to sin(maxNeutTilt) * maxTWR.
			
			//if shipVelocitySurface:mag < 80 set sampleInterval to 0.2.
			//else set sampleInterval to 0.1.
			
			
			//payload 
			if pickup {
				if alt:radar > 9 {
					set pickup to false.
					
					selectMode(m_pos).
					set mode to m_pickup.
					
					set attachPart to payload:partstagged("ap")[0].
					
					set targetGeoPos to body:geopositionof(attachPart:position).
					//set minAlt to targetGeoPos:terrainheight + 25.
					set minAlt to (attachPart:position - body:position):mag - body:radius + 11.
					
					
					set magnet to ship:partstagged("magnet")[0].
					set magnetMod to magnet:getmodule("KASModuleMagnet").
					set magnetAttached to false.
					set winchLowering to false.
					set magnetLastHeight to 9999999.
					set magnetSpeed to 0.5.
					
					set mainWinch to ship:partstagged("winch")[0].
					set mainWinchMod to mainWinch:getmodule("KASModuleWinch").
					
					set triggerOnce to true.
					
					kuniverse:forceactive(ship).
					wait until kuniverse:activevessel = ship.
					global extcam is addons:camera:flightcamera.
					set extcam:position to payload:position + north:vector * -30 + vcrs(north:vector,upVector) * 30 + up:vector * 20.
					wait 0.08.
				}				
			}
		}
		
	} // << ### end of SLOW TICK
	
	set throt to totalThrust:mag/maxThr.
	set maxTWRVec to shipFacing * maxTWR.
	//set availableTWR to availableTWR * 0.95 + 0.05 * (ship:availablethrust / adjustedMass).
	
	// ##################################
	// ### Fuel stuff and autodocking ###
	// >>
	//if hasPort {
	//	if (fuel < 30 or brakes) and charging = false and isDocked = false and (autoFuel or brakes) {
	//		brakes off.
	//		setLights(1,0.2,0.2).
	//		set targetPort to ship:rootpart.
	//		set lowDist to 5000.
	//		list targets in targs.
	//		local targetChargeVeh is ship.
	//		for cur_vehicle in targs {
	//			if cur_vehicle:position:mag < lowDist {
	//				local hasFuel is false.
	//				for res in cur_vehicle:resources {
	//					if res:name = fuelType {
	//						if res:capacity > droneRes:capacity set hasFuel to true.
	//					}
	//				}
	//				if hasFuel {
	//					local ports is cur_vehicle:partstagged("R").
	//					for port in ports {
	//						if port:position:mag < lowDist and port:state = "Ready" and not(port:tag = "X") and port:name = localPort:name
	//						{
	//							//if vang(upVector,port:facing:vector) < 20 {
	//								set targetPort to port.
	//								set targetChargeVeh to cur_vehicle.
	//								set lowDist to port:position:mag.
	//							//}
	//						}
	//					}
	//				}
	//			}
	//		}
	//		if not(targetPort = ship:rootpart) and not(targetChargeVeh = ship) { //found a valid port
	//			set old_mode to mode.
	//			set old_submode to submode.
	//			set old_pos to targetGeoPos.
	//			if old_submode = m_follow { set old_tarVeh to tarVeh. set old_tarPart to tarPart. }
	//			set old_followDist to followDist.
	//			set followDist to 0.
	//			set mode to m_follow.
	//			set submode to m_follow.
	//			set doLanding to false.
	//			set tarVeh to targetChargeVeh.
	//			
	//			local aimPoints is tarVeh:partstagged("aimPoint").
	//			if aimPoints:length > 0 {
	//				set tarPart to aimPoints[0].
	//				set aimPoint to true.
	//				
	//				set PID_pitch:kp to 35.
	//				set PID_roll:kp to 35.
	//				
	//				tarVeh:connection:sendmessage("dock").
	//			}
	//			else {
	//				set tarPart to targetPort.
	//				set aimPoint to false.
	//			}
	//			//set tarPart:tag to "X".
	//			set charging to true.
	//			if fuel < 25 {
	//				entry("WARNING: Low on power!").
	//				warning("WARNING: Low on power!").
	//			}
	//			entry("Autodocking to nearby port..").
	//			popup("Autodocking to nearby port..").
	//			setLights(1,1,0).
	//		}
	//	}
	//	if isDocked {
	//		
	//		set fuel to round((droneRes:amount/droneRes:capacity)*100).
	//		
	//		if charging { //first tick as docked
	//			unlock throttle.
	//			for ms in core:part:modules { //for some reason terminal sometimes closes on dock
	//				set m to core:part:getmodule(ms).
	//				if m:hasaction("Open Terminal") m:doevent("Open Terminal").
	//			}
	//			
	//			set minimumDockTime to time:seconds + 6.
	//			
	//			local deployed is false.
	//			for eng in engs {
	//				set eng:thrustlimit to 0.
	//				eng:shutdown.
	//				for moduleStr in eng:modules {
	//					local mod is eng:getmodule(moduleStr).
	//					if mod:hasevent("Retract Propeller") { mod:doevent("Retract Propeller"). set deployed to true. }
	//				}
	//				
	//			}
	//			//if deployed wait 2.
	//			
	//			//dronePod:controlfrom.
	//			for elm in ship:elements { if elm:name = tarVeh:name set bank to elm. }
	//			set transferOrder to transferall(fuelType, bank, core:element).
	//			set transferOrder:active to true.
	//			set charging to false.
	//			wait 0.
	//			//set targetPort:tag to "R".
	//			entry("Docked, recharging..").
	//		}
	//		if (fuel > 99 or autoFuel = false) and forceDock = false and time:seconds > minimumDockTime {
	//			setLights(0,1,0).
	//			set transferOrder:active to false.
	//			wait 0.
	//			localPort:undock.
	//			wait 0.1.
	//			tarVeh:connection:sendmessage("undock").
	//			
	//			set forceUpdate to true.
	//			set freeSpeed to 0.
	//			set mode to old_mode.
	//			set submode to old_submode.
	//			if old_submode = m_follow {
	//				set tarVeh to old_tarVeh.
	//				set followDist to old_followDist.
	//				set tarPart to old_tarPart.
	//			}
	//			else set targetGeoPos to old_pos.
	//			entry("Undocking.").
	//			
	//			kuniverse:forceactive(ship).
	//			dronePod:controlfrom.
	//			
	//			local deployed is false.
	//			for eng in engs {
	//				for moduleStr in eng:modules {
	//					local mod is eng:getmodule(moduleStr).
	//					if mod:hasevent("Deploy Propeller") { mod:doevent("Deploy Propeller"). set deployed to true. }
	//				}
	//			}
	//			if deployed wait 1. 
	//			
	//			for eng in engs {
	//				eng:activate.
	//				set eng:thrustlimit to 100.
	//			}
	//			
	//			set th to 0. set lockToggle to true.
	//			
	//			set PID_pitch:kp to 75.
	//			set PID_roll:kp to 75.
	//			
	//			set vecs[markHorV]:START to v(0,0,0). 
	//			set vecs[markDesired]:START to v(0,0,0).
	//			//set vecs[markAcc]:START to v(0,0,0). 
	//			set vecs[markTar]:START to v(0,0,0).
	//			for ms in core:part:modules {
	//				set m to core:part:getmodule(ms).
	//				if m:hasaction("Open Terminal") m:doevent("Open Terminal").
	//			}
	//		}
	//		
	//	}
	//	else if charging and brakes { //abort dock
	//		brakes off.
	//		set charging to false.
	//		setLights(0,1,0).
	//		popup("Cancelling docking..").
	//		tarVeh:connection:sendmessage("abort").
	//		
	//		set forceUpdate to true.
	//		set freeSpeed to 0.
	//		set mode to old_mode.
	//		set submode to old_submode.
	//		if old_submode = m_follow {
	//			set tarVeh to old_tarVeh.
	//			set followDist to old_followDist.
	//			set tarPart to old_tarPart.
	//		}
	//		else set targetGeoPos to old_pos.
	//	}
	//} 
	// << ### end of fuel stuff
	
	if not(isDocked) {
		// ########################
		// ### VARS AND TARGETS ###
		// >>
		set v_vel to verticalspeed.
		set v_vel_abs to abs(v_vel).
		set h_vel to vxcl(upVector,shipVelocitySurface).
		set h_vel_mag to h_vel:mag.
		set dT to time:seconds - tOld.
		set tOld to time:seconds.
		
		//if submode = m_follow or (submode = m_land and charging) {
		//	set relativeV to vxcl(upVector,tarVeh:velocity:surface) - h_vel.
		//	
		//	if tarVeh:loaded and tarVeh:unpacked {
		//		if tarPart = ship:rootpart { taggedPart(). }  //target just got into range, look for part
		//		set targetPart to tarPart.
		//		if not(targetPart:ship = tarVeh) set tarVeh to targetPart:ship. //in case of docking/undocking, update vessel 
		//	}
		//	else { set targetPart to tarVeh. }
		//	set targetGeoPos to body:geopositionof(targetPart:position).
		//	set targetPos to targetPart:position.
		//	
		//	//autodock
		//	if charging and submode = m_follow and not aimPoint {
		//		if vxcl(upVector, targetPos):mag < 0.3 and relativeV:mag < 0.1 and v_vel_abs < 1 and abs(altErr) < 1 {
		//			set mode to m_land.
		//			set submode to m_land.
		//		}
		//	}
		//} 
		
		//else 
		if mode = m_pickup {
			
			
			
			
			set angVelAvg to angVelAvg * 0.9 + 0.1 * ship:angularvel:mag.
			print "avg angvel: " + angVelAvg + "      " at (0,10).
			
			if magnetAttached {
				set targetPos to boosterPort:nodeposition.
				set targetGeoPos to body:geopositionof(targetPos).
				
				
				set boosterPortAlt to targetGeoPos:terrainheight + vdot(upVector, targetPos - targetGeoPos:position).
				
				set portError to vxcl(upVector,  targetPos - payloadPort:nodeposition).
				if portError:mag < 0.3 {
					set minAlt to minAlt - 0.01.
				}
				else {
					set payloadPortHeight to payloadPortHeight * 0.98 + 0.02 * vdot(upVector, -payloadPort:nodeposition). //to smooth it out a bit
					set minAlt to boosterPortAlt + payloadPortHeight + 4.
				}
				
				
				
				if payloadPort:state:contains("Docked") {
					//set minAlt to boosterPortAlt + vdot(upVector, -payloadPort:nodeposition) + 4.
					if magnetMod:getfield("state") = "On" magnetMod:doevent("magnet on/off").
					if winchLowering toggle ag3.
					set massOffset to 0.
					set forceUpdate to true.
					
					set extcam:target to payloadPort.
					set extcam:positionupdater to donothing.
					set extcam:position to  body:geopositionof(payloadPort:position + north:vector * 60 + vcrs(north:vector,upVector) * 30):position.
					set extcam:fov to 65.
					//set extcam:position to extcam:position * 0.98 + 0.02 * body:geopositionof:(payloadPort:position + north:vector * 60 + vcrs(upVector,north:vector) * 30):position.
					
					wait 0.
					toggle ag2.
					set mode to m_pos.
					set magnetAttached to false.
					wait 0.08.
					
					when mainWinchMod:getfield("cable state") = "Idle" then {
						set targetGeoPos to LATLNG(-0.0967891422880653,-74.6174187707576).
						set targetPosXcl to v(100,0,0).
						
						when targetPosXcl:mag < 1 and h_vel_mag < 0.8 then {
							selectMode(m_land).
							
							payloadPort:ship:connection:sendmessage("Lift done").
							wait 0.
							payloadPort:ship:connection:sendmessage("launch").
							
							when ship:status = "Landed" then {
								set exit to true.
								
								
								
							}
						}
					}
				}
				else {
					set extcam:fov to extcam:fov * 0.99 + 0.01 * 70.
					
					set portToPort to boosterPort:position - payloadPort:position.
					
					if portToPort:mag > 100
						set extcam:positionupdater to { return extcam:position * 0.95 + 0.05 * (angleaxis(4,upVector) * (vxcl(upVector,extcam:position):normalized * 30)). }.
					else {
						if triggerOnce {
							set extcam:target to boosterPort.
							set extcam:positionupdater to donothing.
							set extcam:position to boosterPort:position + upVector + north:vector * 8 + portToPort * 0.5.
							wait 0.
							set triggerOnce to false.
						}
						set extcam:positionupdater to { 
							set portToPort to boosterPort:position - payloadPort:position.
							return extcam:position * 0.99 + 0.01 * (boosterPort:position + upVector + (north:vector * 10 + portToPort * 0.1):normalized * 10). 
						}.
					}
					//set extcam:positionupdater to { return extcam:position * 0.95 + 0.05 * (angleaxis(4,upVector) * (vxcl(upVector,extcam:position):normalized * min(30,24 + portError:mag/4) + upVector * min(0,-33 + portError:mag/4))). }.
					
				}
				
				
				
			}
			else {
				
			
				set targetGeoPos to body:geopositionof(attachPart:position).
				set targetPos to attachPart:position.
			
				set magnetHeight to vdot(upVector, magnet:position - targetPos).
				if magnetHeight < 3 {
					if magnetMod:getfield("state") = "Off" magnetMod:doevent("magnet on/off").
				}
				else {
					if magnetMod:getfield("state") = "On" magnetMod:doevent("magnet on/off").
				}
				
				if winchLowering and magnetHeight < 1 and magnetSpeed < 0.4 { //detected magnet attachment
					toggle ag3.
					set winchLowering to false.
					set payloadPortHeight to vdot(upVector, -payloadPort:nodeposition).
					set magnetAttached to true.
					set massOffset to payload:mass.
					set speedlimit to 0.
				}
				else if angVelAvg < 0.04 and h_vel_mag < 0.1 and vxcl(upVector,targetPos):mag < 0.3 {
					if not winchLowering { 
						toggle ag3.
						set magnetSpeed to 1.
						set extcam:target to magnet.
					}
					set winchLowering to true.
					
				}
				else if winchLowering {
					toggle ag3.
					set winchLowering to false.
				}
				
				set magnetSpeed to magnetSpeed * 0.95 + 0.05 * ((magnetLastHeight - magnetHeight)/dT).
				print round(magnetSpeed,3) + "    magnet speed" at (15,15).  
				set magnetLastHeight to magnetHeight.
				
				if not(winchLowering) set extcam:positionupdater to { return extcam:position * 0.98 + 0.02 * ((-north:vector * 25) + upVector * (payload:distance / 25) + vcrs(upVector,north:vector) * -30). }.
				else {
				
					set extcam:positionupdater to { return magnet:position * 0.7 + angleaxis(0.5,upVector) * (vxcl(upVector,extcam:position):normalized * (5 + vdot(upVector, magnet:position - targetPos) * 1.5)). }.
				}
			}
		}
		else if submode = m_hover or submode = m_free set targetGeoPos to ship:geoposition.
		else set targetPos to targetGeoPos:position.
		
		set targetPosXcl to vxcl(upVector, targetPos).
		
		
		set v_dif to (shipVelocitySurface - velold)/dT.
		set velold to shipVelocitySurface.
		
		set h_acc to vxcl(upVector, v_dif).
		set v_acc to vdot(upVector, v_dif).
		// <<
		
		// ########################
		// ### MASS CALIBRATION ###
		// >>
		
		//if hasWinch {
		//}	
		
		// <<
		
		// #########################
		// ### TERRAIN DETECTION ###
		// >> 
		set posCheckHeight to min(altitude , ship:geoposition:terrainheight).
		
		if lastT + sampleInterval < time:seconds { //sampleInterval is 0.2 seconds on slower speeds, lower on higher speeds
			set lastT to time:seconds.
			
			// Check height around the drone
			if groundspeed < 10 {
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
				
				//if terMark {
				//	set terPos to curGeo:position.
				//	set pm to pList[i].
				//	set vecs[pm]:start to terPos.
				//	set vecs[pm]:vec to upVector * tHeight.
				//}
				
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
		
		set tAlt to max(minAlt,tAlt + tHeight).
		set altErr to tAlt - altitude. //negative = drone above target height
		set altErrAbs to abs(altErr).
		// <<
		
		// #####################################
		// ### DesiredVV (vertical velocity) ###  
		// >>
		set tilt to vang(upVector,shipFacing).
		
		set acc_freefall to gravityMag * gravitymod. // the larger the modifier the more overshoot & steeper climb
		set acc_maxthr to (maxTWR - gravityMag) * thrustmod. 
		
		if altErr < 0 set max_acc to acc_maxthr.
		else set max_acc to acc_freefall.
		
		//set burn_duration to v_vel_abs/abs(max_acc). //fix  
		//set burn_distance to (v_vel * burn_duration) + (0.5 * max_acc * (burn_duration^2)). //fix  
		
		local driftDist is min(0,(tilt/90) * v_vel) * 0.5. 
		
		set desiredVVOld to desiredVV.
		if altErr > 0 { //below target alt
			set desiredVV to sqrt( 2 * (max(0.01,altErrAbs - v_vel * climbDampening) ) * max_acc ). //sqrt( 2 * (altErrAbs^0.9) * max_acc ).
			set desiredVV to max(desiredVV, tan(maxClimbAng) * h_vel_mag * 1.5). //make sure we climb steep enough 
		}
		else { //above
			set desiredVV to sqrt( 2 * max(0.1,altErrAbs + driftDist + v_vel*0.16) * max_acc ). 
			//set desiredVV to  sqrt( 2 * (altErrAbs * 0.9) * max_acc ).
			set desiredVV to -desiredVV.
		}
		
		if magnetAttached set desiredVV to min(0.1 + min(2,altErrAbs/3),max(-2,desiredVV * 0.2)).
		
		
		
		if submode = m_land and (h_vel_mag < 0.5 or not(ship:status = "FLYING")) {
			set desiredVV to min(-0.5,-sqrt( 2 * max(0.001,alt:radar-2) * acc_maxthr * 0.1 )).
		}
		else if altErrAbs < 1 set desiredVV to altErr*2.
		
		set stVVec to desiredVV - v_vel.
		
		//set dvv_error to vecdraw(v(0,0,0),upVector * stVVec/2,rgba(0.5,0.5,0,1),round(stVVec,1),1,true,0.2). 
		// <<
		
		// ########################################
		// ### DesiredHV (horizontal velocity) ####
		// >>
		
		//set speedlimit to min(speedlimitmax,30*TWR).
		
		
		if submode = m_free {
			set targetPosXcl to heading(freeHeading,0):vector * 10000.
			set speedlimit to freeSpeed.
		}
		else if mode = m_pickup and magnetAttached {
			
			set speedlimit to min(30,speedlimit + 0.055).
		}
		else set speedlimit to speedlimitmax.
		
		
		
		
		
		if magnetAttached and mode = m_pickup { //slow down carefully as we approach the target with payload on the winch
			set desiredHV to targetPosXcl:normalized * (targetPosXcl:mag^0.80) * 0.25. //(targetPosXcl:mag^0.80) * 0.25
		}
		else if submode = m_land and not(charging) set desiredHV to v(0,0,0).
		else if targetPosXcl:mag > 15 {
			set approachSpeed to vdot(targetPosXcl:normalized,h_vel).
			
			local maxSteeringVec is angleaxis(-maxNeutTilt, vcrs(upVector,targetPosXcl)) * upVector.
			local angSteerError is vang(shipFacing,maxSteeringVec).

			set desiredHV to targetPosXcl:normalized * sqrt( 2 * max(0.01,targetPosXcl:mag - max(0.5,angSteerError/(maxNeutTilt*2)) * approachSpeed * 2) * (maxHA^0.95) * 0.5). 
		}
		else set desiredHV to targetPosXcl:normalized * (targetPosXcl:mag^0.85) * 0.5. 
		
		

		set desiredHV:mag to min(speedlimit,desiredHV:mag).
		
		set stVec to desiredHV - h_vel.
		set stVec to stVec + max(0,(h_vel_mag - 100) / 50) * vxcl(desiredHV,stVec). //focus on closing down sideslip as velocity goes above 100
		
			
		
		// <<
		
		// ######################################## 
		// ### targetVec & desired acceleration ###
		// >>
		
		set desiredHAcc to stVec.
		set PID_hAcc:maxoutput to maxTWR.
		set desiredHAcc:mag to PID_hAcc:update(time:seconds, -stVec:mag).
		
		set PID_vAcc:maxoutput to maxTWR.
		set PID_vAcc:minoutput to -maxTWR - gravityMag.
		
		set desiredVAccVal to PID_vAcc:update(time:seconds, -stVVec).
		
		
		if desiredVAccVal < -gravityMag { 
			set desiredVAccVal to -gravityMag + (desiredVAccVal + gravityMag)/8. //  /4
		}
		
		set desiredVAcc to upVector * desiredVAccVal.
		
		set verticalAcc to desiredVAcc - gravity.
		set desiredAccVec to desiredHAcc + verticalAcc.
		// need to cap the horizontal part
		if desiredAccVec:mag > maxTWR  {
			if (desiredVAccVal + gravityMag) > maxTWR { //if verticalAcc:mag > maxTWR {
				
				set desiredAccVec to verticalAcc + desiredHAcc * 0.25. 
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
		if hasWinch set tiltCap to min(vang(upVector,desiredHAcc - gravity),30). 
		else set tiltCap to (desiredHAcc:mag / maxTWR) * 600. // 600
		
		if targetVecTilt > tiltCap and (altErr > -20 or mode = m_pos or doLanding or hasWinch) { //cap tilt
			set rotAx to -vcrs(targetVec, upVector).
			set targetVec to upVector.
			set targetVec to angleaxis(tiltCap, rotAx) * targetVec.
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

		//set th to (desiredAccVec:mag * angleErrorMod) / maxTWR.
		if tilt > 90 set th to max(gravityMag * 2 / maxTWR, (angleErrorMod * desiredHAcc:mag) / maxTWR ).
		
		set th to max(0.01,min(1,th)).
		// << 

		// ######################## 
		// ### engine balancing ###
		// >>
		
		set pitch_err to toRad(vang(shipFacing, targetVecTop)).
		set roll_err to toRad(vang(shipFacing, targetVecStar)).
		
		set pitch_acc to (pitch_torque * (thMid^0.5) * 0.10) / pitch_inertia. //(pitch_torque * thMid * 0.30) / pitch_inertia. 
		set roll_acc to (roll_torque * (thMid^0.5) * 0.10) / roll_inertia. //(roll_torque * thMid * 0.30) / roll_inertia. 
		
		set pitch_vel_target to ( 2 * pitch_err * pitch_acc)^0.5.
		set roll_vel_target to ( 2 * roll_err * roll_acc)^0.5.

		
		
		if vdot(facing:topvector, targetVecTop) < 0 set pitch_vel_target to -pitch_vel_target.
		if vdot(facing:starvector, targetVecStar) < 0 set roll_vel_target to -roll_vel_target.
		
		set angVel to ship:angularvel.
		set pitch_vel to -vdot(facing:starvector, angVel).
		set roll_vel to vdot(facing:topvector, angVel).
		
		
		if vang(targetVec,shipFacing) > 15 or max(abs(pitch_vel),abs(roll_vel)) > 0.2 set th to max(th,thMid * 0.5). //give a bit of extra power to steer when needed.
		//set throt to max(0.01,th).
		
		set PID_pitch:setpoint to pitch_vel_target.
		set pitch_distr to PID_pitch:update(time:seconds, pitch_vel) / th. // / throt.
		
		set PID_roll:setpoint to roll_vel_target.
		set roll_distr to PID_roll:update(time:seconds, roll_vel) / th. // / throt.
		
		set eng_pitch_pos["part"]:thrustlimit to 100 + pitch_distr.
		set eng_pitch_neg["part"]:thrustlimit to 100 - pitch_distr.
		set eng_roll_pos["part"]:thrustlimit to 100 + roll_distr.
		set eng_roll_neg["part"]:thrustlimit to 100 - roll_distr.
		
		//since steering reduces effective thrust, up the throttle to match the intended thrust
		local thrustDuringSteering is (400 - min(100,abs(pitch_distr)) - min(100,abs(roll_distr)))/400.
		set th to min(1,th / thrustDuringSteering).
		
		// <<
		
		// ###################### 
		// ### Some overrides ###
		// >>
		if doLanding {
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

				local destinationVecLength is max(3,(1 + targetPos:mag)^0.5).
				set vecs[markDestination]:vec to upVector * -destinationVecLength.
				set vecs[markDestination]:start to targetPos + upVector * destinationVecLength.
				set vecs[markDestination]:width to max(0.2,-1 + (max(1,targetPosXcl:mag) ^ 0.25)).
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
		//set dTavg to dTavg * 0.95 + dT * 0.05.
		//set title_hz:text to round(1/dTavg) + "hz".
		//
		//if box_all:visible {
		//	if box_right:visible {
		//		set g_speedlimit:text to round(speedlimit):tostring().
		//		set g_groundpspeed_label_val:text to round(h_vel_mag) + "m/s".
		//		set g_radar_label_val:text to round(alt:radar) + "m".
		//		set g_height_error_label_val:text to round(altErr,1)+ "m".
		//	
		//	}
		//	
		//	if submode = m_free {
		//		set g_free_speed_label_val:text to round(freeSpeed,1) + " m/s".
		//		set g_free_heading_label_val:text to round(freeHeading,1):tostring().
		//	}
		//	else if submode = m_follow {
		//		set g_target_distance_label_val:text to round(tarVeh:distance) + "m".
		//	}
		//	
		//	if time:seconds > consoleTimer + 0.5 {
		//		if submode = m_hover or submode = m_free { }
		//		else if submode = m_land { }
		//		else if mode = m_pos or mode = m_pickup {
		//			local distTarget is round(targetPosXcl:mag,2).
		//			if distTarget > 1000 set g_pos_distance:text to "Distance: " + round((distTarget / 1000),1) + " km".
		//			else set g_pos_distance:text to "Distance: " + distTarget + " m".
		//			
		//			set g_pos_lat:text to "Latitude: " + round(targetGeoPos:lat,2).
		//			set g_pos_lng:text to "Longitude: " + round(targetGeoPos:lng,2).
		//			set g_pos_hdg:text to "Heading: " + round(targetGeoPos:heading,1):tostring().
		//		}
		//		
		//		//Stats
		//		set title_fuel_text:text to round(fuel) + "%".
		//		if fuel >= 50 set title_fuel_text:style:textcolor to rgb(0,1,0).
		//		else set title_fuel_text:style:textcolor to rgb(1,fuel/50,0).
		//		
		//		
		//		set g_TWR_label_val:text to round(TWR,2):tostring().
		//		set g_mass_label_val:text to round(mass,3) + "t".
		//		set g_payload_label_val:text to round(adjustedMass - mass,3) + "t". 
		//		
		//		//
		//		set consoleTimer to time:seconds.
		//	}
		//}
		//else {
		//	set title_fuel_text:text to round(fuel) + "%".
		//	if fuel >= 50 set title_fuel_text:style:textcolor to rgb(0,1,0).
		//	else set title_fuel_text:style:textcolor to rgb(1,fuel/50,0).
		//}
		
		// << ### terminal end ###
		

		
		
		
		// <<
		
		// #############################
		// ### Yaw rotatron controls ###
		// >>
		if yawControl {
			set yawAngVel to vdot(shipFacing, angVel).
			if ship:control:pilotroll > 0 set targetRot to 6 - th * 4.
			else if ship:control:pilotroll < 0 set targetRot to -6 + (th * 4).
			else {
				if abs(yawAngVel) > 0.002 { 
					set targetRot to min(5,abs(yawAngVel) * 8 * (5/TWR) * (1.25 - th)).   
					if yawAngVel > 0 set targetRot to -targetRot.
				}
				else set targetRot to 0.
			}
			
			for s in yawRotatrons {
				s:moveto(targetRot,1).
			}
			
		} // <<
	}
	
	//keep the thing running at 25hz
	if tOld = time:seconds wait 0.03. 
	else wait 0.
}