@LAZYGLOBAL on.
// autopilot
runoncepath("lib_UI.ks").
runoncepath("steeringmanager.ks").
loadSteering().

sas off.
set st to lookdirup(ship:facing:vector,up:vector).
lock steering to st.
set th to throttle.
lock throttle to th.

// #### PID ###
// >>
	
	set maxBank to 60.
	function init_bank_pid {
	  return PIDLOOP(3, 0.00, 4, -maxBank, maxBank).
	}
	set bankPid to init_bank_pid().
	set bankHardPid to PIDLOOP(0.2, 0.01, 0.4, -90, 90).

	set attackPid to PIDLOOP(3, 0.0, 10, -10, 10).
	set pitchPid to PIDLOOP(1.5, 0.3, 2.0, -15, 15). //(1.5, 0.3, 5.0, -15, 15). //outputs extra climb angle to get the velocity climb angle corrected
	
	
	// set rollPid to init_roll_pid().
	set throtPid to PIDLOOP(0.1, 0.001, 0.05, 0, 1).
	
	set climbPid to PIDLOOP(0.4, 0.0, 0.05, -15, 15).
	
	set steeringmanager:rollcontrolanglerange to 180. //force steeringmanager not to ignore roll
// << 

// ### Initual Stuff / default vars ###
// >>
	set m_manual to 0.
	set m_circle to 1.
	
	set m_mode to m_manual.
	set m_submode to m_manual.
	
	set modeString to "manual".
	
	set targetSpeed to round(airspeed).
	set targetAlt to round(altitude).
	set controlSpeed to true.
	if altitude < 100 set controlAlt to false.
	else set controlAlt to true.
	
	set targetHeading to round(headingOf(ship:facing:vector),2).
	set targetPitch to 0.
	
	//settings default vars
	set stallSpeed to 70.
	set maxBankSpeed to 150.
	set aoaHigh to 8. //high speeds
	set aoaLow to 15. //at low speeds
	set bankFactor to 1.
	set bankHard to false.
	set circleRadius to 1000.
	
	set vd_stTarget to vecs_add(v(0,0,0),v(0,0,0),green,"",0.2).
	set vd_st to vecs_add(v(0,0,0),v(0,0,0),magenta,"",0.2).
	set vd_vel to vecs_add(v(0,0,0),velocity:surface,yellow,"",0.2).
	
	function saveSettings {
		local lex is lexicon(
			"stallSpeed", stallSpeed,
			"maxBankSpeed",maxBankSpeed,
			"bankFactor",bankFactor,
			"maxBank",maxBank
		).
		
		local filePath is path("0:/json/" + ship:name + "/autopilot.json").
		writejson(lex, filePath).
	}

	function loadSettings {
		local filePath is path("0:/json/" + ship:name + "/autopilot.json").
		
		if exists(filePath) {
			local lex is readjson(filePath).
			
			set stallSpeed to lex["stallSpeed"].
			set maxBankSpeed to lex["maxBankSpeed"].
			set bankFactor to lex["bankFactor"].
			set maxBank to lex["maxBank"].
			return true.
		}
		else return false.
	}
	
	loadSettings().
// <<

// ### Console ###
// >>


set terminal:brightness to 1.
set terminal:width to 44.
set terminal:height to 45.
clearscreen.


// use the first two of these varables to set the position of the menu. The last two affect the width of the menu.
local startLine is 4.		//the first menu item will start at this line in the terminal window
local startColumn is 4.		//menu item description starts at this x coordinate, remember to leave some space for the marker on the left
local nameLength is 21.		//how many characters of the menu item names to display
local valueLength is 8.	//how many characters of the menu item values to display
local sv is -9.9993134. 	// just a value that is extremely unlikely to be set to any of the varibles we want to change with the menu
runpath("lib_menu.ks").


set mainMenu to list(
	//list("Modes",		"text"),
	//list("[>] MODES",	"menu" , 	{ return modesMenu. }),
	list("",			"text"),
	//list("Active mode:","display",	{ return modeString. }),
	list("-",			"line"),
	list("Speed:",		"number", 	{ parameter p is sv. if p <> sv set targetSpeed to max(0,round(p)). return targetSpeed. }, 10),
	list("Heading:",	"number", 	{ parameter p is sv. if p <> sv { if p > 360{set p to p - 360.} else if p < 0{set p to 360 + p.} set targetHeading to p. } return round(targetHeading,2). }, 1),
	list("Climb:",		"number", 	{ parameter p is sv. if p <> sv set targetPitch to max(-90,min(90,p)). return round(targetPitch,2). }, 1),
	list("",			"text"),
	list("Alt ctrl:",	"bool", 	{ parameter p is sv. if p <> sv set controlAlt to boolConvert(p). return controlAlt. }),
	list("Altitude:",	"number", 	{ parameter p is sv. if p <> sv set targetAlt to max(0,round(p,1)). return targetAlt. }, 10),
	
	list("Bank Hard:",	"bool", 	{ parameter p is sv. if p <> sv set bankHard to boolConvert(p). return bankHard. }),
	
	list("-",			"line"),
	list("[>] STEERINGMANAGER",	"menu" , 	{ return steeringMenu. }),
	list("[>] VESSEL SETTINGS",	"menu" , 	{ return settingsMenu. }),
	list("[X] Exit", 			"action", { set done to true. })
).

set modesMenu to list(
	list("Manual",	"action", 	{ 
		set m_mode to m_manual. 
		set m_submode to m_manual.
		set modeString to "manual".
		set targetPitch to 0.
		set targetHeading to round(headingOf(ship:facing:vector),2).
		setMenu(mainMenu).
	}),
	list("Circle",	"action", 	{
		set m_mode to m_circle.
		set m_submode to m_circle.
		set modeString to "circling".
		set circleLoc to ship:geoposition.
		set vecs[vd_pos]:show to true.
		setMenu(circleModeMenu).
	}),
	list("-",				"line"),
	list("[<] MAIN MENU",		"backmenu", { return mainMenu. })
).

set circleModeMenu to list(
	list("Circle Radius:",	"number", 	{ parameter p is sv. if p <> sv set circleRadius to max(100,round(p)). return circleRadius. }, 100),
	list("-",				"line"),
	list("[<] MAIN MENU",		"backmenu", { return mainMenu. })
).

set steeringMenu to list(
	list("[>] Angular Velocity PID",	"menu", { return pidMenu. }),
	list("-",						"line"),
	list("Pitch settling time:",	"number", { parameter p is sv. if p <> sv set steeringmanager:pitchts to max(0.01,round(p,2)). return steeringmanager:pitchts. }, 0.1),
	list("Yaw settling time:",		"number", { parameter p is sv. if p <> sv set steeringmanager:yawts to max(0.01,round(p,2)). return steeringmanager:yawts. }, 0.1),
	list("Roll settling time:",		"number", { parameter p is sv. if p <> sv set steeringmanager:rollts to max(0.01,round(p,2)). return steeringmanager:rollts. }, 0.1),
	list("",						"text"),
	list("Max stopping time:",		"number", { parameter p is sv. if p <> sv set steeringmanager:maxstoppingtime to max(0.01,round(p,2)). return steeringmanager:maxstoppingtime. }, 0.1),
	list("Roll ctrl ang range:",	"number", { parameter p is sv. if p <> sv set steeringmanager:rollcontrolanglerange to round(p,2). return steeringmanager:rollcontrolanglerange. }, 1),
	list("",						"text"),
	list("Angle error:",			"display", { return round(steeringmanager:angleerror,2). }),
	list("Pitch error:",			"display", { return round(steeringmanager:pitcherror,2). }),
	list("Yaw error:",				"display", { return round(steeringmanager:yawerror,2). }),
	list("Roll error:",				"display", { return round(steeringmanager:rollerror,2). }),
	list("-",						"line"),
	list("Pitch torq adjust:",		"number", { parameter p is sv. if p <> sv set steeringmanager:pitchtorqueadjust to round(p,2). return steeringmanager:pitchtorqueadjust. }, 1),
	list("Pitch torq factor:",		"number", { parameter p is sv. if p <> sv set steeringmanager:pitchtorquefactor to max(0.01,round(p,2)). return steeringmanager:pitchtorquefactor. }, 0.1),
	list("",						"text"),
	list("Yaw torq adjust:",		"number", { parameter p is sv. if p <> sv set steeringmanager:yawtorqueadjust to round(p,2). return steeringmanager:yawtorqueadjust. }, 1),
	list("Yaw torq factor:",		"number", { parameter p is sv. if p <> sv set steeringmanager:yawtorquefactor to max(0.01,round(p,2)). return steeringmanager:yawtorquefactor. }, 0.01),
	list("",						"text"),
	list("Roll torq adjust:",		"number", { parameter p is sv. if p <> sv set steeringmanager:rolltorqueadjust to round(p,2). return steeringmanager:rolltorqueadjust. }, 1),
	list("Roll torq factor:",		"number",	{ parameter p is sv. if p <> sv set steeringmanager:rolltorquefactor to max(0.01,round(p,2)). return steeringmanager:rolltorquefactor. }, 0.01),
	list("-",						"line"),
	list("Facing vecs:",			"bool", { parameter p is sv. if p <> sv set steeringmanager:showfacingvectors to boolConvert(p). return steeringmanager:showfacingvectors. }),
	list("Angular vecs:",			"bool", { parameter p is sv. if p <> sv set steeringmanager:showangularvectors to boolConvert(p). return steeringmanager:showangularvectors. }),
	list("Write CSV files:",		"bool", { parameter p is sv. if p <> sv set steeringmanager:writecsvfiles to boolConvert(p). return steeringmanager:writecsvfiles. }),
	list("-",						"line"),
	list("[ ] REVERT CHANGES", 		"action", { loadSteering(). }),
	list("", 						"text"),
	list("[ ] SAVE CHANGES", 		"action", { saveSteering(). }),
	list("[<] MAIN MENU",			"backmenu", { return mainMenu. })
).

set pidMenu to list(
	list("Pitch kP:", "number", { parameter p is sv. if p <> sv set steeringmanager:pitchpid:kp to max(0,p). return steeringmanager:pitchpid:kp. }, 0.1),
	list("Pitch kI:", "number", { parameter p is sv. if p <> sv set steeringmanager:pitchpid:ki to max(0,p). return steeringmanager:pitchpid:ki. }, 0.1),
	list("Pitch kD:", "number", { parameter p is sv. if p <> sv set steeringmanager:pitchpid:kd to max(0,p). return steeringmanager:pitchpid:kd. }, 0.1),
	list("Setpoint:", "display", { return round(steeringmanager:pitchpid:setpoint,2). }, 1),
	list("Error:", "display", { return round(steeringmanager:pitchpid:error,2). }, 1),
	list("Output:", "display", { return round(steeringmanager:pitchpid:output,2). }, 1),
	list("-", "line"),
	list("Yaw kP:", "number", { parameter p is sv. if p <> sv set steeringmanager:yawpid:kp to max(0,p). return steeringmanager:yawpid:kp. }, 0.1),
	list("Yaw kI:", "number", { parameter p is sv. if p <> sv set steeringmanager:yawpid:ki to max(0,p). return steeringmanager:yawpid:ki. }, 0.1),
	list("Yaw kD:", "number", { parameter p is sv. if p <> sv set steeringmanager:yawpid:kd to max(0,p). return steeringmanager:yawpid:kd. }, 0.1),
	list("Setpoint:", "display", { return round(steeringmanager:yawpid:setpoint,2). }, 1),
	list("Error:", "display", { return round(steeringmanager:yawpid:error,2). }, 1),
	list("Output:", "display", { return round(steeringmanager:yawpid:output,2). }, 1),
	list("-", "line"),
	list("Roll kP:", "number", { parameter p is sv. if p <> sv set steeringmanager:rollpid:kp to max(0,p). return steeringmanager:rollpid:kp. }, 0.1),
	list("Roll kI:", "number", { parameter p is sv. if p <> sv set steeringmanager:rollpid:ki to max(0,p). return steeringmanager:rollpid:ki. }, 0.1),
	list("Roll kD:", "number", { parameter p is sv. if p <> sv set steeringmanager:rollpid:kd to max(0,p). return steeringmanager:rollpid:kd. }, 0.1),
	list("Setpoint:", "display", { return round(steeringmanager:rollpid:setpoint,2). }, 1),
	list("Error:", "display", { return round(steeringmanager:rollpid:error,2). }, 1),
	list("Output:", "display", { return round(steeringmanager:rollpid:output,2). }, 1),
	list("-", "line"),
	list("[ ] Reset PIDs", "action", { steeringmanager:resetpids(). }),
	list("[ ] REVERT CHANGES", "action", { loadSteering(). }),
	list("", "text"),
	list("[ ] SAVE CHANGES", "action", { saveSteering(). }),
	list("[<] BACK",		"backmenu", { return steeringMenu. })
).

set settingsMenu to list(
	//list(name,type,get/set function,increment multiplier (for numbers)).

	list("Stall Spd:",		"number", 	{ parameter p is sv. if p <> sv set stallSpeed to max(5,round(p)). return stallSpeed. }, 1),
	list("AoA High Spd:",	"number", 	{ parameter p is sv. if p <> sv set aoaHigh to max(5,round(p,2)). return aoaHigh. }, 0.1),
	list("AoA Low Spd:",	"number", 	{ parameter p is sv. if p <> sv set aoaLow to max(5,round(p,2)). return aoaLow. }, 0.1),
	list("",				"text"),
	list("Bank limit:",		"number", 	{ parameter p is sv. if p <> sv { set maxBank to max(10,round(p)). set bankPid to init_bank_pid(). } return maxBank. }, 10),
	list("Bank Factor:",	"number", 	{ parameter p is sv. if p <> sv set bankFactor to max(0.1,round(p,2)). return bankFactor. }, 0.1),
	list("Full Bank Spd:",	"number", 	{ parameter p is sv. if p <> sv set maxBankSpeed to max(stallSpeed + 10,round(p)). return maxBankSpeed. }, 10),
	list("",			"text"),
	list("-",				"line"),
	list("[ ] SAVE CHANGES",	"action", 	{ saveSettings(). }),
	list("[<] MAIN MENU",		"backmenu", { return mainMenu. })
).

// the list that defines the menu items: their names, types, and function
set activeMenu to mainMenu.

// <<

function headingOf {
	parameter vect. //0 = north, 90 = east
	local ang is vang( vxcl(up:vector,vect) , north:vector ).
	if vdot(heading(270,0):vector,vect) > 0 set ang to 360 - ang.
	return ang.
}
function getBank { //thank you dunbaratu for letting me steal this one. 
	local raw is vang(up:vector, - facing:starvector).
	if vang(up:vector, facing:topvector) > 90 {
		if raw > 90 return raw - 270.
		else return raw + 90.
	} else {
		return 90 - raw.
	}
}

local done is false.
unlock wheelsteering.
drawAll().
// ### LOOP ###
until done {
	inputs().
	refreshAll().
	
	local shipfacing is ship:facing:vector.
	local vel is velocity:surface.
	set forwardSpeed to vdot(shipfacing,vel).
	set th to throtPid:Update(time:seconds, forwardSpeed - targetSpeed).
	if (forwardSpeed - targetSpeed) > 10 brakes on.
	else brakes off.
	
	
	local upVec is up:vector.
	local hVel is vxcl(upVec,vel).
	//local hFacing is vxcl(up:vector,ship:facing:vector).
	
	//local shipHeading is headingOf(hVel).
	
	if m_submode = m_circle {
		local centerPos is vxcl(upVec,circleLoc:position).
		local wantedPos is centerPos - centerPos:normalized * circleRadius.
		//set wantedPos to vcrs(upVec,centerPos):normalized * circleRadius.
		set wantedPos:mag to wantedPos:mag^0.5.
		local targetHeadingVec is wantedPos + vcrs(upVec,centerPos):normalized * targetSpeed.
		set targetHeading to headingOf(targetHeadingVec).
		
		set vecs[vd_pos]:start to circleLoc:position.
		print "r dist: " + round(centerPos:mag) + "m   " at (round(terminal:width*0.5),terminal:height-2).
	}
	
	// ### ALT ###
	if controlAlt {
		//set targetPitch to climbPid:update(time:seconds, (altitude + verticalspeed * 0.5) - targetAlt). 
		
		set verticalTarget to min(50,max(-50,(targetAlt - altitude)*0.3)).
		set targetPitch to min(targetPitch + 0.1,max(targetPitch - 0.1,climbPid:update(time:seconds, verticalspeed - verticalTarget))). 
	}
	else {
		set targetAlt to round(altitude,1).
	}
	
	// ### HEADING ###
	set stTarget to heading(targetHeading,targetPitch):vector.
	set vecs[vd_stTarget]:vec to stTarget:normalized * 40.
	local hStTarget is vxcl(upVec,stTarget).
	local compassError is vang(hVel,hStTarget).
	if compassError < 45 { //kind of hurts to do these 4 calculations an additional time...
		set stNormal to vcrs(hVel,hStTarget).
		set stTarget to angleaxis(vang(hVel,hStTarget)^0.5,stNormal) * stTarget.
		set hStTarget to vxcl(upVec,stTarget).
		set compassError to vang(hVel,hStTarget).
	}
	
	local velPitch is 90 - vang(upVec,vel).
	
	if bankHard and compassError > -20 {
		if vdot(vcrs(upVec,hVel),hStTarget) > 0 set compassError to -compassError.
		
		set stNormal to vcrs(vel,stTarget).
		set st to angleaxis(min(15,vang(vel,stTarget)),stNormal) * vel.
		
		set stRoll to 90 + bankHardPid:update(time:seconds, targetPitch - velPitch ).
		if compassError < 0 set stRoll to -stRoll.
		
		local rollVector is angleaxis(stRoll,shipfacing) * upVec.
		set st to lookdirup(st,rollVector).
	}
	else {
		local attackAngle is 10 + attackPid:update(time:seconds, velPitch - targetPitch). 
			print "st attack ang: " + round(attackangle,2) + "   " at (1,terminal:height-2).
		set stNormal to vcrs(vel,stTarget).
		set st to angleaxis(min(attackAngle,vang(vel,stTarget)),stNormal) * vel.
		
		print "bank ang: " + round(getBank(),2) + "   " at (1,terminal:height-3).
		local pitchAdjust is pitchPid:update(time:seconds, (velPitch - targetPitch) * cos(abs(getBank()))) .
		set st to angleaxis(pitchAdjust,vcrs(hVel,upVec)) * st.
		
		local aoaLimit is aoaHigh.
		//if vang(vel,st) > aoaLimit {
		//	set stNormal to vcrs(vel,st).
		//	set st to angleaxis(pitchAdjust,vcrs(hVel,upVec)) * st.
		//}
		
		//roll w/ no pid
		//local stRoll is min(maxBank,vang(hVel,hStTarget) * 1.5).
		//if vdot(vcrs(upVec,hVel),stTarget) > 0 set stRoll to -stRoll.
		
		//roll with pid
		if alt:radar < 12 set st to lookdirup(st,upVec).
		else  {
			if vdot(vcrs(upVec,hVel),hStTarget) > 0 set compassError to -compassError.
			
			set stRoll to bankPid:update(time:seconds, -compassError * bankFactor * max(0.05,min(1,(forwardSpeed - stallSpeed)/(maxBankSpeed-stallSpeed))) ).  
			print "req bank: " + round(stRoll,2) + "   " at (1,terminal:height-4).
			set bankPid:maxoutput to max(5,min(maxBank,maxBank * (forwardSpeed - stallSpeed)/(maxBankSpeed-stallSpeed))).
			set bankPid:minoutput to -bankPid:maxoutput.
			
			local rollVector is angleaxis(stRoll,shipfacing) * upVec.
			
			set st to lookdirup(st,rollVector).
		}
	}
	
	// Vecs >>
	set vecs[vd_vel]:vec to vel:normalized * 40.
	set vecs[vd_st]:vec to st:vector:normalized * 40.
	
	// <<
	wait 0.
}
sas on.