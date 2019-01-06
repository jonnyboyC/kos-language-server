//rs.ks

clearvecdraws().
run lib_quad.
ag1 off. ag2 off. ag10 off.



list engines in engs.
local yawRotatrons is list().
local i is 0.
for eng in engs {
	if not(eng:ignition) { eng:activate(). wait 0. }
	vecs_add(eng:position,eng:facing:vector * eng:thrust,red,"",0.2).
	set eng:thrustlimit to 0.
	set vecs[i]:show to true.

	for moduleStr in eng:parent:modules {
		if moduleStr = "MuMechToggle" {
			local rot is eng:parent:getmodule("MuMechToggle").
			if rot:hasfield("Rotation") {
				rot:setfield("Acceleration",50).
				yawRotatrons:add(rot).
			}
		}
	}
	
	if vdot(facing:starvector,eng:position) < -0.3 { set eng_roll_pos to eng. }
	else if vdot(facing:starvector,eng:position) > 0.3 { set eng_roll_neg to eng. }
	else if vdot(facing:vector,eng:position) < -0.3 { set eng_pitch_pos to eng. }
	else if vdot(facing:vector,eng:position) > 0.3 { set eng_pitch_neg to eng. }

	
	set i to i + 1.
}

if yawRotatrons:length = 2 or yawRotatrons:length = 4 {
	//entry("Found " + yawRotatrons:length + " servos attached to engines.").
	//entry("Yaw control enabled.").
	set yawControl to true.
	wait 0.2.
}
else set yawControl to false.

// Vecdraws -----------------------------------------------------------

local targetVec is up:forevector.
local targetVecStar is v(0,0,0).
local targetVecTop is v(0,0,0).
local markTar is vecs_add(v(0,0,0),v(0,0,0),cyan,"",0.2).
//local markTarP is vecs_add(v(0,0,0),v(0,0,0),cyan,"TP").
//local markTarY is vecs_add(v(0,0,0),v(0,0,0),cyan,"TY").

set prediction_span to 2. //seconds to check for terrain interesect
set prediction_i to 5. //checks per second
local pList is list(). //terrain prediction vecs
pList:add(0).
local i is 1.
until i > prediction_span * prediction_i {
	pList:add(vecs_add(v(0,0,0),v(0,0,0),rgb(1,0,0.0),"",0.2)).
	set i to i + 1.
}

set timerFlying to time:seconds.
set inAir to false.

set vecs[markTar]:show to true.



function updateVec {
	parameter targetVec.
	set targetVecStar to vxcl(facing:vector, targetVec).
	set targetVecTop to vxcl(facing:starvector, targetVec).
	set vecs[markTar]:vec to targetVec*5.
	
	//set vecs[markTarP]:vec to targetVecTop*5.
	//set vecs[markTarY]:vec to targetVecStar*5.
}
// EO vecdraws ---------------------------------------------------------

function flightcontroller { 
	set gravity to -up:vector * (body:mu / body:position:mag^2).
	
	if not(ship:status = "LANDED") {
		if not(inAir) { //first tick in air
			set timerFlying to time:seconds.
		}
		set inAir to true.
	}
	else {
		if inAir { //first tick landed
			
			local impactV is vdot(-shipNormal, old_vel).
			if impactV > 10 {
				
				HUDTEXT("Impact velocity: " + round(impactV,1) + "m/s", 5, 2, 40, rgb(255,200,0), false).
				
				HUDTEXT("Pitch error: " + round(pitch_err,1), 5, 2, 35, yellow, false).
				HUDTEXT(" Roll error: " + round(roll_err,1), 5, 2, 35, yellow, false).
				HUDTEXT("  Yaw error: " + round(roll_err,1), 5, 2, 35, yellow, false).
				
			}
		}
		set inAir to false.
	}
	
	inputs().
	set shipNormal to geo_normalvector(ship:geoposition,5).
	if vang(ship:facing:topvector,shipNormal) > 5 set tilting to true.
	else set tilting to false.
	
	if inAir {
		set predictedPos to ship:position.
		set old_vel to ship:velocity:surface.
		set vel to ship:velocity:surface.
		local i is 1.
		local hasIntersected is false.
		until i > prediction_span * prediction_i {
			set predictedPos to predictedPos + (vel + 0.5 * gravity)/prediction_i.
			set vel to vel + gravity/prediction_i.
			
			set curGeo to body:geopositionof(predictedPos).
			
			set pm to pList[i].
			set terPos to curGeo:position.
			set vecs[pm]:start to terPos.
			set vecs[pm]:vec to predictedPos - terPos.
			if hasIntersected {
				set vecs[pm]:show to false.
			}
			else if vdot(up:vector,predictedPos - terPos) > 0 and not(i = prediction_span * prediction_i) {
				set vecs[pm]:show to true.
			}
			else if hasIntersected = false {
				set hasIntersected to true.
				set targetVec to geo_normalvector(curGeo,5).
				set vecs[markTar]:start to terPos.
				set vecs[pm]:show to false.
			}
			else if i = prediction_span * prediction_i { //last iteration
				set targetVec to geo_normalvector(curGeo,5).
				set vecs[markTar]:start to terPos.
				set vecs[pm]:show to false.
			}
			else set vecs[pm]:show to false.
			
			set i to i + 1.
		}
	}
	else {
		set targetVec to shipNormal.
		set vecs[markTar]:start to ship:geoposition:position.
		
		for pm in pList {
			set vecs[pm]:show to false.
		}
	}
	updateVec(targetVec).
	
	// ----------------------------------------------
	// engine balancing
	
	set pitch_err to vdot(facing:vector, targetVecTop).
	set roll_err to vdot(facing:starvector, targetVecStar).
	
	set pitch_vel_target to pitch_err * 2.
	set roll_vel_target to roll_err * 2.
	set pitch_vel to -vdot(facing:starvector, ship:angularvel).
	set roll_vel to vdot(facing:vector, ship:angularvel).

	set pitch_distr to PD_seek(PID_pitch, pitch_vel_target, -pitch_vel). //returns 0-100
	set roll_distr to PD_seek(PID_roll, roll_vel_target, -roll_vel).
	
	if inAir or tilting {
		set eng_pitch_pos:thrustlimit to max(0, pitch_distr).
		set eng_pitch_neg:thrustlimit to max(0, -pitch_distr).
		set eng_roll_pos:thrustlimit to max(0, roll_distr).
		set eng_roll_neg:thrustlimit to max(0, -roll_distr).
	}
	else {
		set eng_pitch_pos:thrustlimit to 0.
		set eng_pitch_neg:thrustlimit to 0.
		set eng_roll_pos:thrustlimit to 0.
		set eng_roll_neg:thrustlimit to 0.
	}
	
	local i is 0.
	until i = 4 {
		set vecs[i]:vec to engs[i]:facing:vector * engs[i]:thrustlimit/60.
		set vecs[i]:start to engs[i]:position.
		local c is rgb(255,200*((100 - engs[i]:thrustlimit)/100),0).
		set vecs[i]:color to c.
		set i to i + 1.
	}
	
	
	//-----------------------------------------------
	// yaw control
	if yawControl and not ag2 and time:seconds > timerFlying + 1 {
		local vel is vxcl(targetVec,ship:velocity:surface).
		local front is vxcl(targetVec,facing:vector).
		global roll_err is vang(vel,front).
		if vdot(-facing:starvector,vel) < 0 set roll_err to -1 * roll_err.
		
		set yawAngVel to vdot(facing:topvector, ship:angularvel).
		set yawAngVel to yawAngVel * (180/constant:pi()).
		
		
		
		
		if abs(roll_err) > 2 set roll_vel_target to -3 * (abs(roll_err)^0.7) * (roll_err/abs(roll_err)).
		//else set targetRot to -1 * min(20,sqrt(abs(yawAngVel)) * 5).
		else set roll_vel_target to 0.
		
		set yaw_rotation to PD_seek(PID_roll, roll_vel_target, yawAngVel).
		if pitch_err > 5 * (constant:pi()/180) or roll_err > 5 * (constant:pi()/180) or not(inAir) set yaw_rotation to 0.
		
		print "roll_err abs: " + round(roll_err) + "   " at (1,terminal:height-5).
		print "yawAngVel   : " + round(yawAngVel,2) + "   " at (1,terminal:height-4).
		
		print "roll_vel_target: " + round(roll_vel_target,2) + "   " at (1,terminal:height-2).
		print "yaw_rotation  : " + round(yaw_rotation,2) + "   " at (1,terminal:height-1).
		
		for servo in addons:ir:allservos {
			servo:moveto(yaw_rotation,1000).
			if abs(yaw_rotation) > 0 and abs(servo:position) > 0 and inAir {
				set servo:part:children[0]:thrustlimit to 10 + abs(servo:position).
			}
		}
		
	}
	// -----------------------------------
	
	wait 0.
}

//function that checks for user key input
function inputs {
	if ag10 {
		ag10 off.
		set exit to true.
	}
}

// parameter 1: a geoposition ( ship:GEOPOSITION / body:GEOPOSITIONOF(position) / LATLNG(latitude,longitude) )
// parameter 2: size/"radius" of the triangle. Small number gives a local normalvector while a larger one will tend to give a more average normalvector.
// returns: Normalvector of the terrain. (Can be used to determine the slope of the terrain.)
function geo_normalvector {
	parameter geopos,size_.
	set size to max(5,size_).
	local center is geopos:position.
	local fwd is vxcl(center-body:position,body:angularvel):normalized.
	local right is vcrs(fwd,center-body:position):normalized.
	local p1 is body:geopositionof(center + fwd * size_ + right * size_).
	local p2 is body:geopositionof(center + fwd * size_ - right * size_).
	local p3 is body:geopositionof(center - fwd * size_).
	
	local vec1 is p1:position-p3:position.
	local vec2 is p2:position-p3:position.
	local normalVec is vcrs(vec1,vec2):normalized.
	
	//debug vecdraw: local markNormal is vecs_add(center,normalVec * 300,rgb(1,0,1),"slope: " + round(vang(center-body:position,normalVec),1) ).

	return normalVec.
}

// PID controllers -----------------------------------
global PID_pitch is PD_init(200.0,10,-100,100).
global PID_roll is PD_init(200.0,10,-100,100).

global PID_roll is PD_init(2.0,0,-90,90).


// main controller loop ------------------------------
print "Rover stability assist is running!".
set exit to false.

until exit {
	flightcontroller().
}

//----------------------------------------------------
//EXIT

vecs_clear().
clearvecdraws().
for eng in engs {
	eng:shutdown().
}

if yawControl {
	for rotMod in yawRotatrons {
		rotMod:doaction("move +",false). rotMod:doaction("move -",false).
	}
}
unlock throttle.
set ship:control:pilotmainthrottle to 0.