// ### quad.ks ###

@LAZYGLOBAL on.
clearvecdraws().
clearscreen.
switch to 0.
global all_libs_loaded is false.
//runpath("lib_quad.ksm").
//runpath("lib_json.ksm").
//runpath("race.ksm").
global mode is m_pos.
global submode is m_pos.
global page is 1.
global focused is true.

function selectMode { //this is called whenever a new mode is selected in the menu
	parameter gui_mode.
	if not stMark {
		set vecs[markHorV]:show to false.
		set vecs[markDesired]:show to false.
	}
	
	if gui_mode = m_land {
		set mode to m_free.
		set submode to m_free.
		set doLanding to true.
		set freeSpeed to 0.
		set freeHeading to 90.
		set targetGeoPos to ship:geoposition.
		set vecs[markDestination]:show to false.
	}
	else if gui_mode = m_hover {
		set mode to m_hover.
		set submode to m_hover.
		set vecs[markDestination]:show to false.
	}
	else if gui_mode = m_free {
		set mode to m_free.
		set submode to m_free.
		set doLanding to false.
		set freeSpeed to 0.
		set freeHeading to 90.
		set vecs[markHorV]:show to true.
		set vecs[markDesired]:show to true.
		set vecs[markDestination]:show to false.
	}
	else if gui_mode = m_bookmark {
		set mode to m_bookmark.
		set submode to m_pos.
		next_bookmark().
		set vecs[markDestination]:show to true.
		
	}
	else if gui_mode = m_pos {
		set targetGeoPos to ship:geoposition.
		set targetString to "LOCAL".
		set mode to m_pos.
		set submode to m_pos.
		set destinationLabel to targetString.
		//set vecs[markDestination]:show to true.
		
		//popup("Location submode").
	}
	//else if gui_mode = m_follow {
	//	set activeStack to stack_follow.
	//	dropdown_target:clear().
	//	set targetsInRange to sortTargets(). //get vessels in range
	//	set targetsInRangeStr to targetStrings(targetsInRange). //get their names
	//	set dropdown_target:options to targetsInRangeStr.
	//	set dropdown_target:index to 0.
	//	
	//	set tarVeh to ship.
	//	if hastarget {
	//		if target:istype("Vessel") set tarVeh to target.
	//		else set tarVeh to target:ship.
	//		
	//		tarVeh:connection:sendmessage(list(1)). //request to be added to formation broadcast group
	//		
	//		set mode to m_follow.
	//		set submode to m_follow.
	//		if tarVeh:loaded { taggedPart(). }
	//		else { set tarPart to ship:rootpart. set destinationLabel to tarVeh:name. }
	//		popup("Following " + tarVeh:name).
	//		entry("Following " + tarVeh:name).
	//	}
	//}
	
	if mode <> m_free {
		set doLanding to false.
		if not(stMark) {
			set vecs[markHorV]:show to false.
			set vecs[markDesired]:show to false.
		}
	}
	

	set gravitymod to 1.2.
	set thrustmod to 0.92.
	set PID_pitch:kp to 60. //75
	set PID_roll:kp to 60. //75 
	set climbDampening to 0.8. //0.15
	setLights(0,1,0).
	
	set PID_hAcc to pidloop(1.6 * ipuMod,0,0.2 + 1 - weightRatio,0,90).
	set ang_vel_exponential to 0.5.
	
	for m in gearMods {
		if m:hasaction("extend/retract") m:doaction("extend/retract",false).
	}
	
	
	entry("Switched mode to " + gui_mode).
	
}
function entry {
	parameter s. print s.
}
entry("Booting up program..").

wait 0.

//undock if needed 
set hasMS to false.
set hasPort to false.

brakes off. ag1 off. ag4 off. ag5 off. ag6 off. ag7 off. ag8 off. ag9 off. ag10 off.
vecs_clear().

// ### engine/servo checks and preparations --------------------------------------------------------------------
// >>
set engDist to 0.
set deploying to false.
set canReverse to false.
list engines in engs.
set engsLexList to list().

local i is 0.
for eng in engs {
	//check for foldable engines, unfold
	local thisEngineCanReverse is false.
	local reverseMod is 0.
	for moduleStr in eng:modules {
		
		
		local mod is eng:getmodule(moduleStr).
		if mod:hasevent("Deploy Propeller") {
			mod:doevent("Deploy Propeller").
			set deploying to true.
		}
		
		if mod:hasevent("Set Reverse Thrust") {
			//set canReverse to true.
			set thisEngineCanReverse to true.
			set reverseMod to mod.
		}
		
	}
	
	local currentLex is lexicon(). //temporary dummy lex
	//assign engines as pitch/roll
	if vdot(facing:starvector,eng:position) < -0.3 {
		set eng_roll_pos to lexicon().
		engsLexList:add(eng_roll_pos).
		eng_roll_pos:add("part",eng).
		if thisEngineCanReverse set currentLex to eng_roll_pos.
	}
	else if vdot(facing:starvector,eng:position) > 0.3 {
		set eng_roll_neg to lexicon().
		engsLexList:add(eng_roll_neg).
		eng_roll_neg:add("part",eng).
		if thisEngineCanReverse set currentLex to eng_roll_neg.
	}
	else if vdot(facing:topvector,eng:position) < -0.3 {
		set eng_pitch_pos to lexicon().
		engsLexList:add(eng_pitch_pos).
		eng_pitch_pos:add("part",eng).
		if thisEngineCanReverse set currentLex to eng_pitch_pos.
	}
	else if vdot(facing:topvector,eng:position) > 0.3 {
		set eng_pitch_neg to lexicon().
		engsLexList:add(eng_pitch_neg).
		eng_pitch_neg:add("part",eng).
		if thisEngineCanReverse set currentLex to eng_pitch_neg.
	}
	
	
	if thisEngineCanReverse {
		currentLex:add("canReverse",true).
		currentLex:add("reverseMod",reverseMod).
		currentLex:add("inReverse",false).
	}
	
	set engDist to engDist + vxcl(facing:vector,eng:position):mag.
}
set engDist to engDist/4.
if deploying { entry("Deploying propellers.."). wait 2. }


global yawRotatrons is list().
set i to 0.
for eng in engs {
	if not(eng:ignition) { eng:activate(). wait 0. }
	vecs_add(eng:position,eng:facing:vector * eng:thrust,red,"",0.2).
	set vecs[i]:show to false.
	set eng:thrustlimit to 100.
	
	set rot to 0.
	
	
	
	//check for yaw servos
	for moduleStr in eng:parent:modules {
		if moduleStr = "MuMechToggle" {
			set rot to eng:parent:getmodule("MuMechToggle").
			if rot:hasfield("Rotation") {
				rot:setfield("Acceleration",25).
				
				for s in addons:ir:allservos {
					if s:part = eng:parent { yawRotatrons:add(s). }
				}
			}
		}
	}
	
	set i to i + 1.
}

setLights(0,1,0).

if yawRotatrons:length = 2 or yawRotatrons:length = 4 {
	entry("Found " + yawRotatrons:length + " servos attached to engines.").
	entry("Yaw control enabled.").
	set yawControl to true.
}
else set yawControl to false.
// <<

//### camera stuff ---------------------------------------------------------------------
// >>
set hasGimbal to false.

// <<

// ### Vecdraws -----------------------------------------------------------
// >>

global targetVec is up:forevector.
global targetVecStar is v(0,0,0).
global targetVecTop is v(0,0,0).
global markTar is vecs_add(v(0,0,0),v(0,0,0),cyan,"tgt",0.2).

global markHorV is vecs_add(v(0,0,0),v(0,0,0),blue,"HV",0.2).
global markDesired is vecs_add(v(0,0,0),v(0,0,0),yellow,"",0.2).
global markDestination is vecs_add(v(0,0,0),-up:vector * 3,rgb(1,0.8,0),"",0.2).

global pList is list(). //terrain prediction vecs
pList:add(0).
pList:add(vecs_add(v(0,0,0),up:vector * 3,rgb(1,0,0.0),"",1.0)).
pList:add(vecs_add(v(0,0,0),up:vector * 3,rgb(1,0.2,0.0),"",1.0)).
//pList:add(vecs_add(v(0,0,0),up:vector * 3,rgb(1,0.4,0.0),"",1.0)).
//pList:add(vecs_add(v(0,0,0),up:vector * 3,rgb(1,0.6,0.0),"",1.0)).
//pList:add(vecs_add(v(0,0,0),up:vector * 3,rgb(1,0.8,0.0),"",1.0)). 

set terMark to false.
set stMark to false.
set thMark to false.
set miscMark to false.

function updateVec {
	parameter targetVec.
	set targetVecStar to vxcl(facing:topvector, targetVec).
	set targetVecTop to vxcl(facing:starvector, targetVec).
	set vecs[markTar]:vec to targetVec*5.
	//set vecs[markTarP]:vec to targetVecTop*5.
	//set vecs[markTarY]:vec to targetVecStar*5.
}
// <<


//### User input function ###

function inputs {

	// MISC CONTROLS ##########################################################################################################
	if not(isDocked) and not(charging) {
		if submode = m_free { //manual direction
			if ship:control:pilotyaw <> 0 { // S+D
				set countHeading to countHeading + 1.
				if countHeading <= 10 set freeHeading to freeHeading + ship:control:pilotyaw/5.
				else set freeHeading to freeHeading + ship:control:pilotyaw * min(40,countHeading)/10.
				if freeHeading > 360 set freeHeading to freeHeading - 360.
				else if freeHeading < 0 set freeHeading to freeHeading + 360.
			}
			else {
				set countHeading to 0.
			}
			if ship:control:pilotpitch <> 0 { // W+S
				set freeSpeed to freeSpeed - ship:control:pilotpitch * min(5,max(0.5,abs(freeSpeed*0.1))).
				set freeSpeed to min(2000,max(0,freeSpeed)).
			}
		}
		else if mode = m_pos { //position shift
			if ship:control:pilotyaw <> 0 {
				set targetGeoPosP to targetGeoPos:position.
				set countE to min(150,countE + 1).
				//if countE <= 10 set eastShift to -ship:control:pilotyaw * 0.05.
				set eastShift to -ship:control:pilotyaw * 0.01 * (countE^1.5). 
				if mapview set eastShift to eastShift * 100.
				else set eastShift to eastShift * max(1,min(10,targetGeoPosP:mag ^ 0.1)).
				
				set targetGeoPosP to targetGeoPosP + vcrs(north:vector,up:vector):normalized * eastShift.
				set targetGeoPos to body:geopositionof(targetGeoPosP).
			}
			else {
				set countE to 0.
			}
			if ship:control:pilotpitch <> 0 { 
				set targetGeoPosP to targetGeoPos:position.
				set countN to min(150,countN + 1).
				set northShift to -ship:control:pilotpitch * 0.01 * (countN^1.5).
				if mapview set northShift to northShift * 100.
				else set northShift to northShift * max(1,min(10,targetGeoPosP:mag ^ 0.1)).
				
				set targetGeoPosP to targetGeoPosP + vxcl(up:vector,north:vector):normalized * northShift. 
				set targetGeoPos to body:geopositionof(targetGeoPosP).
				
			}
			else {
				set countN to 0.
			}
		}
		
		if ship:control:pilotfore <> 0 { //target hover height
			set countH to countH + 1.
			set heightShift to ship:control:pilotfore * (0.05 * min(countH,20)).
			set tHeight to max(0.3,round(tHeight + heightShift,2)).
		}
		else {
			set countH to 0.
		}
		
		if ag7 {
			selectMode(m_land). ag3 off.
		}
		else if ag4 {
			selectMode(m_free). ag4 off.
		}
		else if ag5 {
			selectMode(m_bookmark). ag5 off.
		}
		else if ag6 {
			selectMode(m_pos). ag6 off.
		}
		else if ag10 {
			set exit to true.
		}
	}
}


//### Angular momentum / inertia / acceleration stuff ###
// >>

function getInertia { //moment of inertia around an axis
	parameter axis. //vector
	
	local inertia is 0.
	for p in ship:parts {
		set inertia to inertia + p:mass * (vxcl(axis,p:position):mag^2).
	}
	return inertia.
}
set roll_inertia to getInertia(facing:topvector).
set pitch_inertia to getInertia(facing:starvector).

set shipFacing to ship:facing:vector.
function getTorque {
	parameter p. 
	return vxcl(shipFacing,p:position):mag * (p:maxthrust * vdot(shipFacing,p:facing:vector)).
}
set pitch_torque to (getTorque(eng_pitch_pos["part"]) + getTorque(eng_pitch_neg["part"])) / 2.
set roll_torque to (getTorque(eng_roll_pos["part"]) + getTorque(eng_roll_neg["part"])) / 2.

set pitch_acc to pitch_torque / pitch_inertia.
set roll_acc to roll_torque / roll_inertia.

// <<

//### Vars initial ###
//>>
set sampleInterval to 0.2.
set lastTargetCycle to 0.
set doLanding to false.
set rotateSpeed to 0.
list targets in targs.
set target_i to 0.
set tarPart to 0.
set adjustedMass to mass.
set localTWR to (ship:maxthrustat(1) / adjustedMass)/(body:mu / body:position:mag^2).
set TWR to (ship:maxthrustat(1) / adjustedMass)/9.81.
set v_acc_e_old to 0.
set h_acc_e_old to v(0,0,0).
global tOld is time:seconds. 
global velold is velocity:surface. 
global dT is 1. 
global tarVelOld is v(0,0,0).
global tHeight is round(min(12,alt:radar + 8),2).
global th is 0.
global posI is 0.
global accI is 0.
global throtOld is 0.
global lastT is time:seconds - 1000.
//global acc_list is list().
//set i to 0. until i = 5 { acc_list:add(0). set i to i + 1. }
global posList is list().
set i to 0. until i = 10 { posList:add(ship:geoposition:terrainheight). set i to i + 1. }
lock throttle to th.
global thrust_toggle is true. 
set targetGeoPos to ship:geoposition.
set targetString to "LOCAL".
set massOffset to 0.
set charging to false.
set speedlimitmax to 200.
set consoleTimer to time:seconds.
set slowTimer to time:seconds.
set forceUpdate to true.
set desiredHV to v(0,0,0).
set v_acc_dif_average to 0.
set followDist to 0.
set forceDock to false.
if hasPort set autoFuel to true.
else set autoFuel to false.
set autoLand to true.
set patrolRadius to 10.
set massOffset to 0.
set engineCheck to 0.
set stVec to v(0,0,0).
set focusPos to facing:topvector * 10.
set focusCamPos to facing:topvector * 1.
set vMod to 0.
set fuel to 100.
set gravitymod to 1.2.
set thrustmod to 0.85.
set h_vel to v(0,0,0).
set isDocked to false.
set ipuMod to sqrt(min(2000,config:ipu)/2000). //used to slow things down if low IPU setting 
set camMode to 0.
set destinationLabel to "".
set lastCamActivation to 0.
set showstats to false.
set ang_vel_exponential to 0.5.
global doFlip is false.
set dTavg to 0.02. 
set climbDampening to 1.5.
global terrainChecks is 2.
set availableTWR to ship:maxthrustat(1) / ship:mass.
set engineThrustLimitList to list(0,0,0,0).
set gearMods to ship:modulesnamed("ModuleWheelDeployment").
set upVector to up:vector.
set minAlt to 0.
set minimumDockTime to time:seconds.
set h_acc to v(0,0,0).
set desiredVV to 0.
set angVelAvg to 0.
set magnetAttached to false.
set winchModules to ship:modulesnamed("KASModuleWinch").
if winchModules:length > 0 set hasWinch to true.
else set hasWinch to false.
set winchFree to true.
//<<

//### PID controllers ###
//>>
if canReverse {
	global PID_pitch is P_init(100.0,-200,200). 
	global PID_roll is P_init(100.0,-200,200).  
}
else {
	global PID_pitch is pidloop(75, 0, 2, -100, 100). //(75, 0, 2, -100, 100). 
	//global PID_pitch is P_init(50.0,-100,100). //P_init(50.0,-100,100). 
	global PID_roll is pidloop(75, 0, 2, -100, 100). //(75, 0, 2, -100, 100).
	//global PID_roll is P_init(50.0,-100,100). //P_init(50.0,-100,100).
}

global PID_vAcc is pidloop(6,0,0.3,-90,90). //pidloop(8,0,0.5,-90,90).   
set PID_vAcc:setpoint to 0.

//global PID_hAcc is pidloop(2.1,0,0.1,0,90).   //(3,0,0.3,0,90).     
global PID_hAcc is pidloop(1.4 * ipuMod,0,0.2,0,90).  
set PID_hAcc:setpoint to 0.

//horizontal speed to destination PID
//global PID_hVel is pidloop(1,0,0,0,200).
//set PID_hVel:setpoint to 0.
//<<

local filename is "0:vessels/" + ship:name + ".json".
if exists(filename) load_json(). //load saved settings on the local drive, if any.  
set all_libs_loaded to true.
entry("All systems ready. Initializing controllers.").


initializeTrigger(). //the trigger in this will be run at the beginning of every tick
wait 0. //just to make sure the triggers run once before main loop

gear off.
// Retract gears (if any)
for m in gearMods {
	if m:hasaction("extend/retract") m:doaction("extend/retract",false).
}


//### main controller loop

set lockToggle to false.
ag4 on.
set forceUpdate to true.
// CONFIG:STAT TO TRUE.
until exit {
	flightcontroller().
	if lockToggle { set lockToggle to false. lock throttle to th. }
}
//log profileresult() to quadProfile.csv.

ag1 off.
set mode to 10.
set submode to 10.


vecs_clear().
clearvecdraws().
for eng in engs {
	for moduleStr in eng:modules {
		local mod is eng:getmodule(moduleStr).
		if mod:hasevent("Retract Propeller") {
			mod:doevent("Retract Propeller").
		}
	}
	eng:shutdown().
}
if hasGimbal { 
	rotHMod:doaction("move +",false). rotHMod:doaction("move -",false). 
	rotVMod:doaction("move +",false). rotVMod:doaction("move -",false). 
}
if yawControl {
	for s in yawRotatrons {
		s:moveto(0,5).
	}
}
set th to throt.
unlock throttle.
set ship:control:pilotmainthrottle to throt.
entry("Program ended.").
setLights(1,0.1,0.1).
wait 0.2.