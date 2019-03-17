// ### Launch.ks ###

parameter target_apo is 100.
parameter target_inc is 0.
set target_apo to target_apo * 1000.
//runoncepath("kslib/LAZcalc.ks").
runoncepath("kslib/lib_lazcalc.ks").


// >> ### Console ###
runoncepath("lib_UI.ks").
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
		set kuniverse:timewarp:warp to 0.
		add_entry(mission_time() + "Staging to stage " + stage_number).
		local old_th is th.
		set th to 0.
		local i is stage:number.
		until i = stage_number {
			wait until stage:ready. 
			stage.
			wait 1.
			set i to i - 1.
		}
		set th to old_th.
	}
}

function mission_time {
	if go return "T+" + round(time:seconds - mission_start) + " ".
	else return "T-5 ".
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
local cinematic is false.
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
local cam is addons:camera:flightcamera.
set default_fov to cam:fov.
//set spectator_pos to heading(180 + random() * 180,0):vector * 3000. //max(100,random() * 1000).
set spectator_pos to heading(0,0):vector * 5000.
set spectator_pos to body:geopositionof(spectator_pos).
//set cam:target to ship:rootpart.


drawAll(). //draws the menu on the terminal

until go {
	inputs(). //menu stuff
	refreshAll().
	wait 0.
}

// ### Launch ###
set mission_start to time:seconds.
local th is 1.
lock throttle to th.
local runmode is 0.

local st is up:vector.
lock steering to lookdirup(st,ship:facing:topvector).

until ship:maxthrust > 0 {
	if stage:ready stage.
	wait 0.
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

add_entry(mission_time() + "Launch!").

// ### Main loop ###
local done is false.
local boostback_staged is false.
until done or abort {
	inputs(). //checks if certain keys have been input to the terminal and acts accordingly (changing values, opening new menues etc)
	
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
		set pitch_angle to 90 - vang(up:vector,velocity:orbit).
		set st to heading(target_heading, pitch_angle):vector.
		set th to (target_apo - apoapsis)/1000.
		
		if stg_recovery and not boostback_staged and th < 0.1 { //target APO is close, stage away the first stage if it is supposed to be boosting back to LP
			stage_until_number(stage_to_orbit).
			wait 2.
			boostback().
			set boostback_staged to true.
		} 
		else if altitude / body:atm:height > 0.85 stage_until_number(stage_to_orbit).
		
		if altitude > body:atm:height set runmode to 3.
	}
	else if runmode = 3 { //out of atmo
		add_entry(mission_time() + "Out of atmosphere.").
		set th to 0.
		set kuniverse:timewarp:warp to 0.
		if stage:number > stage_to_orbit { stage_until_number(stage_to_orbit). }
		panels on.
		add_entry(mission_time() + "Deploying solar panels.").
		
		wait until kuniverse:activevessel = ship.
		
		if auto_rcs rcs on.
		
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
		wait 3.
		set done to true. //exit the runmodes loop - we're done here!
	}
	
	// ### Camera stuff
	if cinematic {
		if altitude < 10000 {
			set cam_pos to spectator_pos:position + up:vector * 2000.
			set cam:fov to max(1,default_fov - cam_pos:mag/100 - cam_pos:mag^0.75).
			
			//set cam:position to cam_pos.
			//set cam:target to ship:rootpart.
			set cam:distance to cam_pos:mag.
			set cam:pitch to vecToPitch(-cam_pos).

		}
		else {
			set cam:fov to default_fov.
		}
	}
	
	if old_height <> terminal:height or old_width <> terminal:width {
		clearscreen.
		rescale().
		parse_list().
		draw_list().
		drawAll(). //draws the menu on the terminal
		set old_height to terminal:height.
		set old_width to terminal:width.
	}
	else refreshAll(). // tells the menu to refresh/print all relevant fields with updated values
	wait 0.
}

sas on.

if stg_recovery {
	booster_vessel:connection:sendmessage("good luck").
	wait 0.1.
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


