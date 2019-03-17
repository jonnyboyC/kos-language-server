// Just setting up the terminal
set terminal:brightness to 1.
set terminal:width to 41.
set terminal:height to 30.
clearscreen.

runoncepath("lib_UI.ks").

print "MenuTest.ks - " + ship:name at (1,1).
horizontalLine(2,"=").
//verticalLineTo(40,3,20,"|").
//horizontalLineTo(21,0,41,"=").
horizontalLine(21,"=").
print "Some other part of the program.." at (1,26).


// use the first two of these varables to set the position of the menu. The last two affect the width of the menu.
local startLine is 4.		//the first menu item will start at this line in the terminal window
local startColumn is 4.		//menu item description starts at this x coordinate, remember to leave some space for the marker on the left
local nameLength is 16.		//how many characters of the menu item names to display
local valueLength is 12.	//how many characters of the menu item values to display
runpath("lib_menu.ks").


// ##################
// ### The menues ###



// Sentinel value
local sv is -9.9993134. 	// just a value that is extremely unlikely to be set to any of the varibles we want to change with the menu

set mainMenu to list(
	//list(name,type,get/set function,increment multiplier (for numbers)).
	list("A number:",		"number", 	{ parameter p is sv. if p <> sv set number1 to p. return number1. }, 10),
	list("Throttle:",		"number", 	{ parameter p is sv. if p <> sv lock throttle to min(1,max(0,p)). return round(throttle,3). }, 0.1),
	list("Speed:",			"display", 	{ return round(ship:airspeed) + " m/s". }),
	list("[Stage]",			"action", 	{ stage. }),
	list("",				"text"),	//just an empty line
	list("Ship Name:",		"string", 	{ parameter p is sv. if p <> sv and p <> "" set ship:name to p. return ship:name. }),
	list("Status:",			"display", 	{ return ship:status. }),
	list("",				"text"),
	list("SAS:",			"bool", 	{ parameter p is sv. if p <> sv toggle sas. return sas. }),
	list("Lights:",			"bool", 	{ parameter p is sv. if p <> sv toggle lights. return lights. }),
	list("-",				"line"),	//only use single character strings for "line" 
	list("[HUDTEXT menu]",	"menu", 	{ return hudtextMenu. }),
	list("",				"text"),
	list("[EXIT]",			"action",	{ set done to true. })
).

set hudtextMenu to list(
	list("String:",			"string",	{ parameter p is sv. if p <> sv set hudString to p. return hudString. }),
	list("Duration:",		"number", 	{ parameter p is sv. if p <> sv set hudDuration to p. return hudDuration. }, 1),
	list("Style:",			"number", 	{ parameter p is sv. if p <> sv set hudStyle to min(4,max(1,round(p))). return hudStyle. }, 1), //hudtext style needs to be an integer between 1 and 4, so we need to round it and clamp it
	list("Size:",			"number", 	{ parameter p is sv. if p <> sv set hudSize to max(1,round(p)). return hudSize. }, 1),
	list("[Color]",			"menu", 	{ return colorMenu. }),
	list("",				"text"),
	list("[Show on HUD]",	"action",	{ testFunction(hudString).}),
	list("-",				"line"),
	list("[SUBMENU]",		"menu", 	{ return subMenu2. }),
	list("[BACK]",			"backmenu", { return mainMenu. }) //the backmenu should point back to the parent menu (so when you press backspace the script will know what menu to send you back to)
).

set colorMenu to list(
	list("Color",			"text"),
	list("  R:",			"number", 	{ parameter p is sv. if p <> sv set hudR to min(1,max(0,round(p,3))). return hudR. }, 0.1),
	list("  G:",			"number", 	{ parameter p is sv. if p <> sv set hudG to min(1,max(0,round(p,3))). return hudG. }, 0.1),
	list("  B:",			"number", 	{ parameter p is sv. if p <> sv set hudB to min(1,max(0,round(p,3))). return hudB. }, 0.1),
	list("",				"text"),
	list("[Show on HUD]",	"action",	{ testFunction(hudString).}),
	list("=",				"line"),
	list("[BACK]",			"backmenu", { return hudtextMenu. })
).

set subMenu2 to list(
	list("Another submenu",	"text"),
	list("_",				"line"),
	list("[BACK]",			"backmenu",	{ return hudtextMenu. }),
	list("[MAIN MENU]",		"menu", 	{ return mainMenu. }) //you don't have to go back to just the previous menu
).

// we need to set this variable to the menu we want to display at the start
set activeMenu to mainMenu.

// ############################################################################
// ### Variables, functions, etc - that we want our menues to alter/display ###

local number1 is -12.74.
local testBool is true.

local hudString is "something..".
local hudDuration is 2.
local hudStyle is 2.
local hudSize is 40.
local hudR is 1.
local hudG is 0.1.
local hudB is 0.75.


function testFunction {
	parameter s.
	hudtext(s,hudDuration, hudStyle, hudSize, rgb(hudR,hudG,hudB), false).
}

local done is false.

// ############
// ### LOOP ###

drawAll(). //needs to be called once after all of the variables used in the menu have been declared/set. If not the menu won't show until 

until done {
	
	//you need to call this function in your running loop or in a persistent trigger so that key inputs can be checked. 
	//Doesn't necessarily need to be run every tick, larger intervals will just cause it to lag a bit more.
	inputs(). 
	
	if activeMenu = mainMenu { //if we want to display updated values to a menu (if it is active in this case)
		updateLine(2).  //the number here is the index number of the menu item, or in other words the line number (starting at 0.
		updateLine(6).
	}
	
	wait 0.
}