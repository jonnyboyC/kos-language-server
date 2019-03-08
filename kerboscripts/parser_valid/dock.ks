//### Dock.ks

parameter tar is target.
clearscreen. clearvecdraws().

local dist is 5000.
SET KUNIVERSE:DEFAULTLOADDISTANCE:ORBIT:UNLOAD TO dist.
SET KUNIVERSE:DEFAULTLOADDISTANCE:ORBIT:LOAD TO dist-500.
WAIT 0.
SET KUNIVERSE:DEFAULTLOADDISTANCE:ORBIT:PACK TO dist - 1.
SET KUNIVERSE:DEFAULTLOADDISTANCE:ORBIT:UNPACK TO dist - 1000.
WAIT 0.


local mode is "approach".

if tar <> ship {
	if tar:istype("Vessel") set target_vessel to tar.
	else if tar:istype("Part") or tar:istype("Dockingport") {
		set target_vessel to tar:ship.
		set target_port to tar.
	}
}

rcs on.
sas off.

local st is ship:facing:vector.
local top_st is ship:facing:topvector.
lock steering to lookdirup(st,top_st).

local th is 0.
lock throttle to th.

local wanted_velocity is v(0,0,0).
local target_radius is 300.
local sphere_radius is 50.
local rcs_only is false.
local ignore_roll is true.
local roll_offset is 0.
local hold is true.
local translation_mode is "engines".

local localports is list().
for p in ship:dockingports {
	if p:state = "Ready" localports:add(p).
	local temp_hl is highlight(p,white).
	set temp_hl:enabled to false.
}
wait 0.1.

local localport_i is 0.
local localport is localports[localport_i].
local local_highlight is highlight(localport,yellow).
set local_highlight:enabled to true.

local highlights_cleared is false.
local targetports is list().
local targetport_i is 0.
local targetport is 0.
local targetport_confirmed is false.

runoncepath("cam.ks").
local cam is addons:camera:flightcamera.
set cam:target to ship.
local old_position is cam:position.
local cam_timer is time:seconds - 10.
local cam_destination is cam:position.




// >> ### Vecdraws
	set vd_facing to vecdraw(v(0,0,0),v(0,0,0),cyan,"facing",1,true,0.2).
	set vd_relative_v to vecdraw(v(0,0,0),v(0,0,0),blue,"relative v",1,true,0.2).
	set vd_wanted_v to vecdraw(v(0,0,0),v(0,0,0),yellow,"wanted v",1,true,0.2).
	
	set vd_side_error to vecdraw(v(0,0,0),v(0,0,0),rgb(1,0.5,0),"side error",1,false,0.2).
	set vd_acc to vecdraw(v(0,0,0),v(0,0,0),green,"acc",1,true,0.2).
	
	set vd_port_to_ship to vecdraw(v(0,0,0),v(0,0,0),yellow,ship:name,1,false,0.2).

// <<

// >> ### PID controllers
	set translate_forward to pidloop(3,0.1,0.5,-1,1).
	set translate_top to pidloop(translate_forward:kp,translate_forward:ki,translate_forward:kd,-1,1).
	set translate_star to pidloop(translate_forward:kp,translate_forward:ki,translate_forward:kd,-1,1).
// <<

// >> ### Terminal
	runoncepath("lib_UI.ks").
	set terminal:brightness to 1.
	set terminal:width to 55.
	set terminal:height to 45.
	clearscreen.

	// use the first two of these varables to set the position of the menu. The last two affect the width of the menu.
	local startLine is 4.		//the first menu item will start at this line in the terminal window
	local startColumn is 4.		//menu item description starts at this x coordinate, remember to leave some space for the marker on the left
	local nameLength is 21.		//how many characters of the menu item names to display
	local valueLength is 16.	//how many characters of the menu item values to display
	local sv is -9.9993134. 	// just a value that is extremely unlikely to be set to any of the varibles we want to change with the menu

	set mainMenu to list(
		//list("Modes",		"text"), 
		list("Mode:",						"display",	{ return mode. }),
		list("",							"text"),
		list("Translation mode:",			"display",	{ return translation_mode. }),
		list("Forward V error:",			"display",	{ return round(forward_v_error,2). }),
		list("Top V error:",				"display",	{ return round(top_v_error,2). }),
		list("Side V error:",				"display",	{ return round(star_v_error,2). }),
		list("",							"text"),
		list("Selected local port:",		"display",	{ return localport_i + ": " + localport:name. }),
		list("[ Next port ]",				"action", { next_localport(). }),
		list("",							"text"),
		list("Selected target port:",		"display",	{ if targetport <> 0 { return targetport_i + ": " + targetport:name. } else return "". }),
		list("[ Next port ]",				"action", { next_targetport(). }),
		list("[ Confirm ]",					"bool", { parameter p is sv. if p <> sv and targetport <> 0 set targetport_confirmed to boolConvert(p). return targetport_confirmed. }),
		list("",							"text"),
		list("",							"text"),
		list("Ignore roll:",				"bool", { parameter p is sv. if p <> sv set ignore_roll to boolConvert(p). return ignore_roll. }),
		list("Offset angle:",				"number", { parameter p is sv. if p <> sv set roll_offset to max(-180,min(180,round(p))). return roll_offset. }, 10),
		list("",							"text"),
		list("Safety radius:",				"number", { parameter p is sv. if p <> sv set sphere_radius to max(20,round(p)). return sphere_radius. }, 1),
		list("",							"text"),
		list("[ HOLD ]",					"bool", { parameter p is sv. if p <> sv set hold to boolConvert(p). return hold. }),
		list("-",							"line"),
		list("[ > ] SteeringManager",		"menu",		{ return steeringMenu. }),
		list("[ Exit ]",					"action", { set done to true. })
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
		list("Pitch kP:", "number", { parameter p is sv. if p <> sv set steeringmanager:pitchpid:kp to max(0,round(p,3)). return steeringmanager:pitchpid:kp. }, 0.1),
		list("Pitch kI:", "number", { parameter p is sv. if p <> sv set steeringmanager:pitchpid:ki to max(0,round(p,3)). return steeringmanager:pitchpid:ki. }, 0.1),
		list("Pitch kD:", "number", { parameter p is sv. if p <> sv set steeringmanager:pitchpid:kd to max(0,round(p,3)). return steeringmanager:pitchpid:kd. }, 0.1),
		list("Setpoint:", "display", { return round(steeringmanager:pitchpid:setpoint,2). }, 1),
		list("Error:", "display", { return round(steeringmanager:pitchpid:error,2). }, 1),
		list("Output:", "display", { return round(steeringmanager:pitchpid:output,2). }, 1),
		list("-", "line"),
		list("Yaw kP:", "number", { parameter p is sv. if p <> sv set steeringmanager:yawpid:kp to max(0,round(p,3)). return steeringmanager:yawpid:kp. }, 0.1),
		list("Yaw kI:", "number", { parameter p is sv. if p <> sv set steeringmanager:yawpid:ki to max(0,round(p,3)). return steeringmanager:yawpid:ki. }, 0.1),
		list("Yaw kD:", "number", { parameter p is sv. if p <> sv set steeringmanager:yawpid:kd to max(0,round(p,3)). return steeringmanager:yawpid:kd. }, 0.1),
		list("Setpoint:", "display", { return round(steeringmanager:yawpid:setpoint,2). }, 1),
		list("Error:", "display", { return round(steeringmanager:yawpid:error,2). }, 1),
		list("Output:", "display", { return round(steeringmanager:yawpid:output,2). }, 1),
		list("-", "line"),
		list("Roll kP:", "number", { parameter p is sv. if p <> sv set steeringmanager:rollpid:kp to max(0,round(p,3)). return steeringmanager:rollpid:kp. }, 0.1),
		list("Roll kI:", "number", { parameter p is sv. if p <> sv set steeringmanager:rollpid:ki to max(0,round(p,3)). return steeringmanager:rollpid:ki. }, 0.1),
		list("Roll kD:", "number", { parameter p is sv. if p <> sv set steeringmanager:rollpid:kd to max(0,round(p,3)). return steeringmanager:rollpid:kd. }, 0.1),
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

	set activeMenu to mainMenu.
	runoncepath("lib_menu.ks").
	
	local forward_v_error is 0.
	local top_v_error is 0.
	local star_v_error is 0.
// <<

local oldT is time:seconds - 0.02.
local oldV is velocityat(ship,time:seconds - 0.02):orbit.
local accel_old is v(0,0,0).
local distance_cap is 0.
local rcs_modifier is 1.
set_rcs_power(1).
drawAll(). //draws the menu on the terminal

until false {
	if not (localport:state = "Ready" or localport:state = "PreAttached") break.
	
	inputs(). //checks if certain keys have been input to the terminal and acts accordingly (changing values, opening new menues etc)
	
	set target_distance to target_vessel:distance.
	set ship_vel to velocityat(ship,time:seconds):orbit.
	set relative_v to ship_vel - velocityat(target_vessel,time:seconds):orbit.
	set top_st to facing:topvector. //default to this, overwrite later in the loop when needed
	set engine_acc to (ship:availablethrust / ship:mass).
	if engine_acc <= 0 set rcs_only to true.
	
	if mode = "cancel velocity" {
		set wanted_velocity to v(0,0,0).
		
		if relative_v:mag < 0.1 set mode to "approach".
	}
	
	else if mode = "approach" {
		if target_distance >= target_radius { //approach the target
			set wanted_velocity to target_vessel:position:normalized * (sqrt( 2 * max(0.01,target_distance - target_radius - vdot(target_vessel:position:normalized,relative_v) * 0.02) * max(1,engine_acc * 0.5) ) + 1).
			set distance_cap to max(distance_cap,max(target_distance / 100, 20)).
			set wanted_velocity:mag to min(wanted_velocity:mag, distance_cap).
			
			if (wanted_velocity - relative_v):mag < 1 set st to -relative_v.
		}
		else set wanted_velocity to v(0,0,0).
		
		if target_vessel:loaded and target_distance <= target_radius set mode to "dockingport selection".
	}
	else if mode = "dockingport selection" {
		set wanted_velocity to v(0,0,0).
		
		if targetport_confirmed and (targetport:istype("part") or targetport:istype("dockingport")) {
			set mode to "dock".
		}
	}
	else if mode = "dock" {
		localport:controlfrom().
		set st to -targetport:facing:vector.
		set rcs_only to true.
		
		local side_error_vec is vxcl(targetport:facing:vector , targetport:nodeposition - localport:nodeposition).
		local side_error is max(0 , side_error_vec:mag).
		
		//debug vector
		set vd_side_error:vec to side_error_vec.
		set vd_side_error:start to localport:nodeposition.
		set vd_side_error:show to true.
		
		local position_ang is vang(-targetport:facing:vector,targetport:position - localport:position).
		if position_ang > 25 {
			set wanted_velocity_pos to target_vessel:position - target_vessel:position:normalized * sphere_radius + vxcl(target_vessel:position,targetport:position + targetport:facing:vector * 10):normalized * max(0, 10 + min(0,target_vessel:distance - sphere_radius)).
			
			
		}
		else {
			local separation_distance is min(sphere_radius, side_error * 10).
			
			
			if hold set separation_distance to max(5,separation_distance).
			set wanted_velocity_pos to (targetport:nodeposition + targetport:facing:vector * separation_distance) - localport:nodeposition.
		
		}
		if wanted_velocity_pos:mag >= 1 set wanted_velocity to wanted_velocity_pos:normalized * min(5 , (wanted_velocity_pos:mag * 0.5)^0.5).
		else set wanted_velocity to wanted_velocity_pos:normalized * (wanted_velocity_pos:mag * 0.25).
			
		if wanted_velocity_pos:mag <= 5 set wanted_velocity:mag to min(wanted_velocity:mag,0.5). //force slow speed when less than 5 m away
		
		
		if vang(facing:vector, st) < 5 and not ignore_roll set top_st to targetport:facing:topvector * angleaxis(roll_offset,targetport:facing:vector).
		
	}
	
	else if mode = "done" break.
	
	// >> ### Acceleration stuff
	local gravityMag is body:mu / (body:radius + altitude)^2.
	local gravityVec is body:position:normalized * gravityMag.
			

	local dt is time:seconds - oldT.
	set oldT to time:seconds.
	set accel to (ship_vel-oldV)/dt.
	set oldV to ship_vel.
		
	set accel_new to accel - gravityVec.
	set accel to accel_new * 0.2 + accel_old * 0.8.
	set accel_old to accel.
	

	set vd_acc:vec to accel * 10.
	set vd_acc:label to round(accel:mag,4):tostring().
	set vd_acc:show to true.
	// <<
	
	// >> ### Steering / throttle management
	
	set velocity_error to wanted_velocity - relative_v.
	
	set forward_v_error to vdot(facing:vector,velocity_error).
	set top_v_error to vdot(facing:topvector,velocity_error).
	set star_v_error to vdot(facing:starvector,velocity_error).
	
	if (velocity_error:mag > 1 or vang(facing:vector,velocity_error) < 5) and not(rcs_only) {
		set translation_mode to "engines".
		set st to velocity_error.
		
		if vang(facing:vector,st) > 10 set th to 0.
		else set th to velocity_error:mag / engine_acc.
		
		set ship:control:fore to 0.
		set ship:control:top to -translate_top:update(time:seconds,top_v_error * 0.5).
		set ship:control:starboard to -translate_star:update(time:seconds, star_v_error * 0.5).
	}
	else {
		set translation_mode to "RCS".
		set th to 0.
		
		local acc_limit is 1.
		
		local highest_input is max(abs(ship:control:fore),max(abs(ship:control:top),abs(ship:control:starboard))).
		if accel_new:mag > acc_limit {
			set rcs_modifier to rcs_modifier * 0.95 + (acc_limit / max(0.1,accel_new:mag/rcs_modifier)) * 0.05.
			print "last acc: " + round(accel_new:mag,4) + "    " at (1,terminal:height - 3).
			print "rcs mod: " + round(rcs_modifier,4) + "    " at (1,terminal:height - 2).
			
			set_rcs_power(rcs_modifier).
		}
		else if highest_input >= 1 and accel_new:mag < acc_limit { 
			set rcs_modifier to min(1,rcs_modifier + 0.0025).
			set_rcs_power(rcs_modifier). 
		}
		
		
		set ship:control:fore to -translate_forward:update(time:seconds,forward_v_error).
		set ship:control:top to -translate_top:update(time:seconds,top_v_error).
		set ship:control:starboard to -translate_star:update(time:seconds, star_v_error).
		
		
	}
	
	// <<
	
	set vd_facing:show to true.
	set vd_relative_v:show to true.
	set vd_wanted_v:show to true.
	
	set vd_facing:vec to facing:vector * 4.
	set vd_relative_v:vec to relative_v.
	set vd_wanted_v:vec to wanted_velocity.
	
	if cam_timer + 3.5 <= time:seconds and cam:target <> ship {
		set cam_last_pos to cam:position.
		
		if cam:target:ship <> ship { //move back to own ship
			set cam_destination to old_position.
			set cam_timer to time:seconds.
			set vd_port_to_ship:show to false.
		}
		
		set cam:target to ship.
		set cam:position to cam_last_pos.
	}
	else if cam_timer + 3.5 > time:seconds {
		local duration is min(3,time:seconds - cam_timer) / 3.
		local off_center is 1 - abs(0.5 - duration).
		
		local cam_travel_distance is (cam_last_pos - cam_destination):mag.
		
		if false {
			local spin_axis is vcrs(cam:target:position - cam_destination, cam:target:position - cam_last_pos).
			local ang is vang(cam:target:position - cam_destination, cam:target:position - cam_last_pos).
			if vang(cam:target:position - cam_destination, (cam:target:position - cam_last_pos) * angleaxis(2, spin_axis)) > ang set ang to -ang.
			
			local new_pos is cam_last_pos * angleaxis(ang * duration, spin_axis).
			set new_pos to cam:target:position + new_pos:normalized * max(10 , (cam:target:position - cam_last_pos):mag * (1 - duration) ).
			
			set cam:position to new_pos.
			//set cam:distance to max(10 , (cam:target:position - cam_last_pos):mag * (1 - duration) ).
		}
		else {
			if cam:target = ship set cam_destination to -targetport:position:normalized * 20 + vcrs(targetport:position,body:angularvel):normalized * 100 * (1-duration).
			else set cam_destination to cam:target:position + cam:target:facing:vector * (8 + cam_travel_dist * (1-duration)).
			
			set cam:position to cam_last_pos * (1 - duration) + cam_destination * duration.
			
			//set cam:position to cam:position * 0.95 + cam_destination * 0.05.
			//set cam_last_pos to cam:position.
		}
		
		if cam:target <> ship and cam:target:ship <> ship {
			
			local vec_start is cam:target:position + cam:target:facing:vector * 2.
			set vd_port_to_ship:start to vec_start.
			set vd_port_to_ship:vec to -vec_start:normalized * 1.
		}
	}
	
	refreshAll(). // tells the menu to refresh/print all relevant fields with updated values
	wait 0.
}

unlock throttle.
unlock steering.

// >> ### Functions
function set_rcs_power {
	parameter limit.
	
	for m in ship:modulesnamed("ModuleRCSFX") {
		m:setfield("thrust limiter",limit * 100).
	}
	
}

function list_target_ports {
	parameter size.
	
	local all_ports is target_vessel:dockingports.
	local ports is list().
	
	for p in all_ports {
		if p:nodetype = size and p:state = "Ready" ports:add(p).
		if not highlights_cleared { 
			local temp_hl is highlight(p,white).
			set temp_hl:enabled to false.
		}
	}
	set highlights_cleared to true.
	return ports.
}

function next_localport {
	set localport_i to localport_i + 1.
	if localport_i >= localports:length set localport_i to 0.
	
	set localport to localports[localport_i].
	if defined local_highlight set local_highlight:enabled to false.
	set local_highlight to highlight(localport,yellow).
	
	change_cam_target(localport).
	
	
}

function next_targetport {
	set targetports to list_target_ports(localport:nodetype).
	
	if target_vessel:loaded and targetports:length > 0 {
		set targetport_i to targetport_i + 1.
		if targetport_i >= targetports:length set targetport_i to 0.
		
		set targetport to targetports[targetport_i].
		set target to targetport.
		
		if defined target_highlight set target_highlight:enabled to false.
		set target_highlight to highlight(targetport,magenta).
		
		change_cam_target(targetport).
		
		set vd_port_to_ship:show to true.
		
		set targetport_confirmed to false.
		if mode = "dock" set mode to "dockingport selection".
	}
}

function change_cam_target {
	parameter cam_target.
	
	if cam:target = ship {
		set old_position to cam:position.
	}
	
	if cam_target:ship = ship set cam_last_pos to cam:position.
	else set cam_last_pos to cam_target:ship:position + cam_target:ship:facing:topvector * 20 + cam_target:ship:facing:vector * 5.
	
	//set cam_last_pos to cam:position.
	
	set cam:target to cam_target.
	set cam:position to cam_last_pos.
	
	
	//set cam_destination to cam_target:position + cam_target:facing:vector * (cam_target:position-cam:position):mag.
	set cam_travel_dist to max(15,(cam_target:position-cam:position):mag).
	wait 0.
	set cam_timer to time:seconds.
	
}
// <<