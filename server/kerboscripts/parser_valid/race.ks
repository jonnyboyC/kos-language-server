@LAZYGLOBAL on.

function listGates {
	list targets in all_targets.
	set new_list to list().
	set counter to 0.
	set c to 0.
	until c = all_targets:length {
	   for target in all_targets {
		   if target:name = "Gate " + counter {
			  new_list:ADD(target).
			  set counter to counter +1.
		   }
	   }
	  set c to c + 1.
	}
	
	global gatesList is new_list.
	global gateI is -1.
}

function nextGate {
	set gateI to gateI + 1.
	if gateI = gatesList:length set gateI to 0.
	global targetGate is gatesList[gateI].
	
	local nextI is gateI + 1.
	if nextI = gatesList:length set nextI to 0.
	global nextTargetGate is gatesList[nextI].
	
	global gateLeft is targetGate:partstagged("left")[0].
	global gateRight is targetGate:partstagged("right")[0].
	global gateHeight is max(0,targetGate:geoposition:terrainheight).
	if targetGate:rootpart:tag = "corner" set gateCorner to true.
	else set gateCorner to false.
	
	set targetString to targetGate:name.
	
	
	//setting the speed limit through the gate:
	
	local targetGateFacing is vxcl(upVector,targetGate:facing:vector):normalized.
	local nextGateFacing is vxcl(upVector,nextTargetGate:facing:vector):normalized.
	set nextGateSideVec to vcrs(upVector,nextGateFacing):normalized. //vector pointing out from the gate's *right* side
	if vang(nextGateSideVec,vxcl(upVector,targetGate:position - nextTargetGate:position)) < 90 set nextGateSideVec to -nextGateSideVec. 
				
	local gateToNextGate is vxcl(upVector,nextTargetGate:position - targetGate:position).
	//local nextSideDist is abs(vdot(nextGateSideVec,targetGate:position - nextTargetGate:position)).
	local nextSideDist is vxcl(nextGateFacing,gateToNextGate):mag.
	local nextSideAcc is maxHA * 1.
	//set nextSideAcc to nextSideAcc * min(1,100 + abs(nextSideDist)/200).  
				
	local nextSideDuration is 1.
	//local side_acc_distance is (vdot(nextGateSideVec,h_vel) * nextSideDuration) + (0.5 * nextSideAcc * (nextSideDuration^2)).
	
	
	
	local gateSideSpeed is sqrt(2*nextSideDist*nextSideAcc).
	set nextSideDist to max(1,nextSideDist - gateSideSpeed * 0.5). //assume 0.5 second is used for orienting drone
	set gateSideSpeed to sqrt(2*nextSideDist*nextSideAcc).
	global gateSpeed is gateSideSpeed / max(0.01,vdot(targetGateFacing,nextGateSideVec)).
	
	if vang(targetGateFacing,nextGateFacing) > 90 set gateSpeed to gateSpeed * (vdot(nextGateSideVec,targetGateFacing)/1.2).
	if vdot(targetGateFacing,gateToNextGate) < 0 set gateSpeed to 20 + gateToNextGate:mag/20. //next gate behind current one
	
	
	
	
	
	
	
	
	
	local angleToNextGate is vang(targetGateFacing,gateToNextGate - nextGateFacing * min(400,gateToNextGate:mag/3)).
	global maxApproachAngle is min(30,angleToNextGate).
	if vdot(vcrs(upVector,targetGateFacing):normalized,gateToNextGate) < 0 set maxApproachAngle to -maxApproachAngle.
	
	set tempFacing to angleaxis(maxApproachAngle, upVector) * targetGateFacing.
	set gateDistVecOld to gateToNextGate.
	set gateFirstIteration to true.
	
	
	
	set gateSpeed to max(25,min(340,gateSpeed)). 
	//global gateSpeed is (nextSideDist^0.8) * (1 + (TWR - 4)/8) * 2. 
	entry("Gate Speed Limit:  " + round(gateSpeed) + " m/s").
	//popup("Gate Speed Limit:  " + round(gateSpeed) + " m/s").
	set destinationLabel to targetString.
	
	
	//local test is (targetGate:position-nextTargetGate:position):mag/(2*tan(vang(targetGate:facing:vector,nextTargetGate:facing:vector)/2)).
}

function detectIntersect {
	local result is false.

	if gateDist < 10 {
		if vdot(h_vel:normalized,gateDistVec) < 2 {
			
			if vdot(-sideVec,gateRight:position) > 0 and vdot(sideVec,gateLeft:position) > 0 {
				set result to true.
			}
		}
	}
	return result.
}
//