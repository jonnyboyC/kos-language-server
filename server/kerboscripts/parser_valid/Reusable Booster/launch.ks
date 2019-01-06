// ### Launch.ks ###
parameter target_apo is 90.
parameter target_inc is 0.
set target_apo to target_apo * 1000.

set target_inc to (random() - 0.5) * 2 * 70.

local th is 0.
lock throttle to th.
set config:ipu to 2000.


//runoncepath("kslib/LAZcalc.ks").
runoncepath("kslib/lib_lazcalc.ks").


// >> ### Console ###
runoncepath("lib_UI.ks").
set terminal:brightness to 1.
set terminal:width to 44.
set terminal:height to 45.
clearscreen.

// use the first two of these varables to set the position of the menu. The last two affect the width of the menu.
global startLine is 4.		//the first menu item will start at this line in the terminal window
global startColumn is 4.		//menu item description starts at this x coordinate, remember to leave some space for the marker on the left
global nameLength is 21.		//how many characters of the menu item names to display
global valueLength is 8.	//how many characters of the menu item values to display
global sv is -9.9993134. 	// just a value that is extremely unlikely to be set to any of the varibles we want to change with the menu

set mainMenu to list(
	//list("Modes",		"text"),
	list("Target APO:",			"number",	{ parameter p is sv. if p <> sv { set target_apo to max(body:atm:height + 100,round(p)). set laz to LAZcalc_init(target_apo,target_inc). } return round(target_apo). }, 10000),
	list("Target INC:",			"number",	{ parameter p is sv. if p <> sv { set target_inc to p. set laz to LAZcalc_init(target_apo,target_inc). } return round(target_inc,2). }, 1),
	list("",					"text"),
	list("Calc Ascent Path:",	"bool",		{ parameter p is sv. if p <> sv set calc_ascent to boolConvert(p). return calc_ascent. }),
	list("Turn end:",			"number",	{ parameter p is sv. if p <> sv and not calc_ascent set turn_end to p. return round(turn_end). }, 1000),
	list("Turn exponent:",		"number",	{ parameter p is sv. if p <> sv and not calc_ascent set turn_exponent to max(0.25,min(1,p)). return round(turn_exponent,2). }, 0.1),
	list("Start Speed:",		"number",	{ parameter p is sv. if p <> sv set turn_speed to p. return round(turn_speed). }, 10),
	list("-",					"line"),
	list("Stage # to orbit:",	"number",	{ parameter p is sv. if p <> sv set stage_to_orbit to min(stage:number,max(0,round(p))). return stage_to_orbit. }, 1),
	list("RCS in orbit:",		"bool",		{ parameter p is sv. if p <> sv set auto_rcs to boolConvert(p). return auto_rcs. }),
	list("1st stg recovery:",	"bool",		{ parameter p is sv. if p <> sv set stg_recovery to boolConvert(p). return stg_recovery. }),
	list("",					"text"),
	list("Cinematic Mode:",		"bool",		{ parameter p is sv. if p <> sv set cinematic to boolConvert(p). return cinematic. }),
	list("-",					"line"),
	list("[ Save settings for craft ]","action", { saveSettings(). }),
	list("[ Launch ]",			"action", { if not go { set go to true. } else { set done to true. } set mainMenu[(mainMenu:length-1)][0] to "[ Abort ]". setMenu(mainMenu). })
).

set activeMenu to mainMenu.
runoncepath("lib_menu.ks").

runoncepath("lib_list.ks").
set_indentation(6).
local old_height is terminal:height.
local old_width is terminal:width.

function rescale {
	list_position(0,terminal:width-1,startLine + activeMenu:length + 3,terminal:height-2).
	horizontalLine(2,"=").
	horizontalLine(startLine + activeMenu:length + 2,"-").
}

// <<

function stage_until_number {
	parameter stage_number.
	if stage:number > stage_number {
		add_entry(mission_time() + "Staging to stage " + stage_number).
		local old_th is th.
		set th to 0.
		local i is stage:number.
		until i = stage_number {
			wait until stage:ready.
			//wait 0.2.
			stage.
			
			set i to i - 1.
		}
		set th to old_th.
	}
}

function mission_time {
	if go return "T+" + round(time:seconds - mission_start) + " ".
	else return "T-10 ".
}


// >> ### Settings and defaults ###

local go is false.
rescale().
add_entry(mission_time() + "Program started.").

sas off.
rcs off.

local turn_end is 40000.
local turn_exponent is 0.5.
local turn_speed is 60.
set starting_alt to altitude.
local calc_ascent is true.
local cinematic is true.
local stage_to_orbit is stage:number.
local stg_recovery is false.
local booster_vessel is ship.
local auto_rcs is true.

function saveSettings {
	local lex is lexicon(
		"turn_end", turn_end,
		"turn_exponent",turn_exponent,
		"turn_speed",turn_speed,
		"calc_ascent",calc_ascent,
		"stage_to_orbit",stage_to_orbit,
		"stg_recovery",stg_recovery,
		"auto_rcs",auto_rcs
	).
	
	local filePath is path("0:/json/launchParams/" + ship:name + ".json").
	writejson(lex, filePath).
	add_entry(mission_time() + "Saved launch parameters for craft " + ship:name).
}

function loadSettings {
	local filePath is path("0:/json/launchParams/" + ship:name + ".json").
	if exists(filePath) {
		local lex is readjson(filePath).
		
		if lex:haskey("turn_end") set turn_end to lex["turn_end"].
		if lex:haskey("turn_exponent") set turn_exponent to lex["turn_exponent"].
		if lex:haskey("turn_speed") set turn_speed to lex["turn_speed"].
		if lex:haskey("calc_ascent") set calc_ascent to lex["calc_ascent"].
		if lex:haskey("stage_to_orbit") set stage_to_orbit to lex["stage_to_orbit"].
		if lex:haskey("stg_recovery") set stg_recovery to lex["stg_recovery"].
		if lex:haskey("auto_rcs") set auto_rcs to lex["auto_rcs"].
		
		add_entry(mission_time() + "Loaded launch parameters for craft " + ship:name).
		return true.
	}
	else return false.
}

loadSettings().

set laz to LAZcalc_init(target_apo,target_inc).
// <<

runoncepath("cam.ks").
set default_fov to 70.


set extcam to addons:camera:flightcamera.
set extcam:fov to default_fov.

//set cam:target to ship:rootpart.


drawAll(). //draws the menu on the terminal
ag10 off.
until go {
	inputs(). //menu stuff
	
	//messages
	if not ship:messages:empty {
		local msg is ship:messages:peek.
		
		
		if msg:content = "launch" {
			ship:messages:pop.
			kuniverse:forceactive(ship).
			add_entry(mission_time() + "Received launch command. Launching in T-5").
			popup("Launching in T-5",1.9).
			
			
			
			
			activeMenu[(mainMenu:length - 1)][2](). //launch
			
			when altitude > 1000 then {
				HUDTEXT("Launching to a " + round(target_apo / 1000) + "km circular orbit", 12, 1, 24, yellow, false).
				HUDTEXT("with a " + round(target_inc,1) + "° inclination", 12, 1, 24, yellow, false).
			}
			
			//for ms in core:part:modules { 
			//	set m to core:part:getmodule(ms).
			//	if m:hasaction("Open Terminal") m:doevent("Open Terminal").
			//}
		}
	}
	
	refreshAll().
	wait 0.
}

// ### Launch ###

function popup {
	parameter s,l.
	
	HUDTEXT(s, l, 2, 40, yellow, false).
}
local i is 5.
until i <= 0 {
	if i < 5 popup("T-" + i,0.9).
	set i to round(i - 1).
	wait 1.
}

local elist is 0.
list engines in elist.
for e in elist {
	if vdot(up:vector, e:position) < 0 {
		e:activate.
	}
}
wait 0.

set spectateGeo to body:geopositionof(extcam:position).

local runmode is 0.

local st is up:vector.
lock steering to lookdirup(st,ship:facing:topvector).

set mission_start to time:seconds.
add_entry(mission_time() + "Launch!").

until ship:maxthrust > 0 {
	wait until stage:ready.
	stage.
	add_entry(mission_time() + "No available thrust, staging..").
}


local starting_TWR is ship:availablethrust / (ship:mass * body:mu / (altitude + body:radius)^2).
set th to 1 / starting_TWR.
if calc_ascent {
	set turn_end to 0.128*body:atm:height * starting_TWR + 0.5 * body:atm:height. // Based on testing
	set turn_end to round(turn_end/100) * 100. //round it off a bit for readability
	SET turn_exponent to round(max(1 / (2.5 * starting_TWR - 1.7), 0.25),2). // Based on testing
	add_entry(mission_time() + "Ascent profile calculated. Starting TWR: " + round(starting_TWR,2)).
}
gear off.
wait 0.
gear on.
wait 0.
gear off.
set randomMode to 0.
set camMode to 0.
set camTimer to 9.
set randomSeed to random().


// ### Main loop ###
local done is false.
local boostback_staged is false.
until done or abort {
	//inputs(). //checks if certain keys have been input to the terminal and acts accordingly (changing values, opening new menues etc)
	
	set upVector to up:vector.
	
	
	// ### Staging ###
	list engines in engs.
	for eng in engs {
		if eng:ignition and eng:flameout {
			wait until stage:ready.
			stage.
			add_entry(mission_time() + "Engine flameout detected, staging.").
			wait 0.1.
			break.
		}
	}
	
	set target_heading to LAZcalc(laz).
	
	// ### Runmodes ###
	if runmode = 0 { //initial ascent, straight up
		set th to min(1,th + 0.02 * (time:seconds - mission_start)).
		if verticalspeed > turn_speed or alt:radar > 2000 {
			set runmode to 1.
			add_entry(mission_time() + "Beginning ascent profile pitch-over..").
		}
	}
	else if runmode = 1 { //ascent profile
		
		set pitch_angle to 90 * (1 - ((altitude - starting_alt) / (turn_end - starting_alt)) ^ turn_exponent).
		set st to heading(target_heading, max(0,pitch_angle)):vector.
		
		set th to max((target_apo - apoapsis)/1000,0.1).
		
		if apoapsis >= target_apo { 
			set runmode to 2.
			add_entry(mission_time() + "Target apoapsis reached. Coasting..").
		}
	}
	else if runmode = 2 { //maintain APO to target APO (fight drag as needed)
		set pitch_angle to 90 - vang(upVector,velocity:orbit).
		set st to heading(target_heading, pitch_angle):vector.
		if vang(st,facing:vector) > 3 set th to 0.
		else set th to (target_apo - apoapsis)/1000.
		
		if stg_recovery and not boostback_staged and th < 0.1 { //target APO is close, stage away the first stage if it is supposed to be boosting back to LP
			set th to 0.
			set extcam:positionupdater to { return sideAxis:normalized * 35. }.
			HUDTEXT("Target APO reached, separating booster", 6, 2, 30, green, false).
			wait 0.2.
			
			ship:partstagged("booster")[0]:undock.
			ship:partstagged("payload")[0]:undock.
			wait 0.
			boostback().
			
			set st to angleaxis(35,upVector) * st.
			rcs on.
			
			wait 2.
			stage_until_number(stage_to_orbit).
			kuniverse:forceactive(booster_vessel).
			set st to velocity:orbit.
			wait until vang(st,facing:vector) < 10.
			
			set boostback_staged to true.
		} 
		else if altitude / body:atm:height > 0.85 and stage:number > stage_to_orbit stage_until_number(stage_to_orbit).
		
		if altitude > body:atm:height set runmode to 3.
	}
	else if runmode = 3 { //out of atmo
		add_entry(mission_time() + "Out of atmosphere.").
		set th to 0.
		if kuniverse:timewarp:warp > 0 set kuniverse:timewarp:warp to 0.
		panels on.
		add_entry(mission_time() + "Deploying solar panels.").
		lights off.
		wait 0.
		lights on.
		if auto_rcs rcs on. else rcs off.
		
		wait until kuniverse:activevessel = ship.
		
		wait 0.1.
		
		set target_spd to sqrt(body:MU/(body:Radius + apoapsis)).
		set spd_at_apo to velocityat(ship,eta:apoapsis + time:seconds):orbit:mag.
		set apo_node to node(eta:apoapsis + time:seconds,0,0,target_spd-spd_at_apo).
		add apo_node.
		
		add_entry(mission_time() + "Maneuver node created at apoapsis. Aligning and warping...").
		runpath("exec.ks",apo_node). //program to timewarp to and execute a node
		
		add_entry(mission_time() + "Circularization burn complete - fine tuning...").
		//if not stg_recovery {
			rcs on.
			runpath("circ.ks","rcs"). //program that does the final touches on the circularization.
			rcs off.
		//}
		
		add_entry(mission_time() + "Launch complete! Final AP: " + round(apoapsis,1) + ", final PE: " + round(periapsis,1) + ", INC: " + round(ship:obt:inclination,3)).
		set done to true. //exit the runmodes loop - we're done here!
	}
	
	// ### Camera stuff
	if cinematic {
		set sideAxis to vcrs(upVector,velocity:surface):normalized.
		set camTimer to camTimer - 0.04.
		if camTimer < 0 {
			
			set camMode to camMode + 1.
			if camMode > 5 set camMode to 0.
			else if camMode = 2 and altitude > 12000 set camMode to 4.
			
			//until randomMode <> camMode set randomMode to floor(random() * 5.9999).
			//set camMode to randomMode.
			
			set camTimer to round(7 + random() * 4).
			set extcam:fov to default_fov.
			
			if camMode = 0 set camTimer to camTimer * 2.
			else if camMode = 4 set camTimer to camTimer * 1.5.
			else if camMode = 2 {
				set spectateGeo to body:geopositionof(velocity:surface * 4 + sideAxis * 30 + (upVector * (-20 - 100 * random()))).
				set spectateAlt to (body:position - velocity:surface * 4):mag - body:radius.
				set camTimer to camTimer * 0.75.
			}
			
			set randomSeed to random().
			
			if boostback_staged {
				if not(extcam:mode = "free") set extcam:mode to "free".
				set extcam:positionupdater to { return extcam:position * 0.9 + 0.1 * ( angleaxis( 1 + randomSeed * 1.5,upVector) * (vxcl(upVector,extcam:position):normalized * 20 + upVector * 5)). }.
			}
			else if camMode = 0 { //rotating
				set extcam:positionupdater to { return extcam:position * 0.9 + 0.1 * ( angleaxis((randomSeed -0.5) * 4,upVector) * (vxcl(upVector,extcam:position):normalized * (50 - abs(randomSeed-0.5) * 40)) + upVector * (randomSeed-0.5) * 40). }.
				
			}
			else if camMode = 1 { //front
				set extcam:positionupdater to { return angleaxis(9 + randomSeed * 5,sideAxis) * facing:vector * (14 + randomSeed * 12). }.
			}
			else if camMode = 2 { //static
				set extcam:positionupdater to { set extcam:fov to arctan(40/(extcam:position:mag^0.75)). return spectateGeo:altitudeposition(spectateAlt). }.
				
			}
			else if camMode = 3 { //back
				
				set extcam:positionupdater to { set extcam:fov to default_fov. return angleaxis(8 + randomSeed * 5,sideAxis) * facing:vector * (-20 - randomSeed * 40). }.
			}
			else if camMode = 4 { //front to back
				//if randomSeed < 0.5 set sideAxis to -sideAxis.
				set extcam:positionupdater to { return sideAxis * (8 + 12 * randomSeed)  + velocity:surface:normalized * (camTimer - 5) * (7 + 10 * randomSeed).  }.
			}
			else if camMode = 5 { //side
				set extcam:positionupdater to { return sideAxis:normalized * (-25 - randomSeed * 40). }.
			}
		}
	}
	
	
	//if old_height <> terminal:height or old_width <> terminal:width {
	//	clearscreen.
	//	rescale().
	//	parse_list().
	//	draw_list().
	//	drawAll(). //draws the menu on the terminal
	//	set old_height to terminal:height.
	//	set old_width to terminal:width.
	//}
	//else refreshAll(). // tells the menu to refresh/print all relevant fields with updated values
	
	wait 0.03.
}

sas on.

if stg_recovery {
	booster_vessel:connection:sendmessage("good luck").
	HUDTEXT("Switching focus to first-stage", 5, 2, 30, green, false).
	wait 3.
	kuniverse:forceactive(booster_vessel).
}

function boostback {
	list targets in tars.
	for ves in tars {
		if ves:position:mag < 2000 {
			if ves:connection:sendmessage("boostback") { set booster_vessel to ves. break. }
		}
	}
}


