@LAZYGLOBAL on.
clearscreen.

runoncepath("lib_UI.ks"). //This library contains some functions to format the terminal

//These are related to loading and saving the settings to the archive (based on craft name)
runoncepath("steeringmanager.ks").
if loadSteering() HUDTEXT("Loaded steeringmanager settings from 0:/json/" + ship:name + "/steering.json",15,2,25,yellow,false).
else HUDTEXT("No steeringmanager settings found. Using default values",8,2,25,yellow,false).

//Example variables
local targetHeading is 90.
local testBool is true.
local testNumber is 10.


//Setting up the menus:
// use the first two of these varables to set the position of the menu. The last two affect the width of the menu.
global startLine is 1.		//the first menu item will start at this line in the terminal window
global startColumn is 4.		//menu item description starts at this x coordinate, remember to leave some space for the marker on the left (so minimum value should be 4)
global nameLength is 22.		//how many characters of the menu item names to display
global valueLength is 20.	//how many characters of the menu item values to display
global sv is -9.9993134. 	// just a value that is extremely unlikely to be set to any of the varibles we want to change with the menu
set terminal:width to max(terminal:width,startColumn + nameLength + valueLength + 4).

set mainMenu to list(
	list("This is the main menu",	"text"),
	list("Altitude:",				"display",	{ return round(altitude). }),
	list("-",						"line"),
	list("Ship name:",				"string",	{ parameter p is sv. if p <> sv set ship:name to p. return ship:name. }),
	list("Test bool:",				"bool", 	{ parameter p is sv. if p <> sv set testBool to boolConvert(p). return testBool. }),
	list("",						"text"),
	list("Heading:",				"number", 	{ parameter p is sv. if p <> sv {
														if p > 360 set p to p - 360. 
														else if p < 0 set p to 360 + p.
														set targetHeading to p.
													} 
													return round(targetHeading,2). }, 10),
	list("-",						"line"),
	list("[>] Steeringmanager",	"menu" , 	{ return steeringMenu. }),
	list("[X] Exit", 			"action", { set done to true. })
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
runpath("lib_menu.ks").
drawAll().

local done is false.
until done {
	inputs(). //this function captures user inputs to the terminal
	
	//other logic
	//....
	
	refreshAll(). //this function updates the display of all variables in the currently open menu
	wait 0.
}