// Just setting up the terminal
set terminal:brightness to 1.
set terminal:width to 54.
set terminal:height to 24.
clearscreen.

run lib_menulist1.
runoncepath("lib_ui.ks").

horizontalLine(5,"=").
horizontalLine(23,"=").

print "                  [ Run mode: 000 ]                   " at(0, 2).
print "======================================================" at(0, 3).
print "                    [ 000 ALARM ]                     " at(0, 4).


local startLine is 7.		//the first menu item will start at this line in the terminal window
local startColumn is 18.		//menu item description starts at this x coordinate, remember to leave some space for the marker on the left
local nameLength is 28.		//how many characters of the menu item names to display 16
local valueLength is 21.	//how many characters of the menu item values to display 12
runpath("lib_menu.ks").
//run errorlistexe.

// ##################
// ### The menus ###



// Sentinel value
local sv is -9.9993134. 	// just a value that is extremely unlikely to be set to any of the varibles we want to change with the menu

set MasterMenu to list(
	list("[Error List]",		"menu", 	{ return mainMenu. }),
	list("[EXIT]",			"action",	{ set done to true. })
	).

set mainMenu to list(
	//list(name,type,get/set function for values,increment multiplier (for numbers)).
	list("Navigate to error # for more",	"text"),
	list("information about error.",			"text"),
	list("",			"text"),
	list("[001-100]",		"menu", 	{ return Menu0100. }),
	list("[101-200]",		"menu", 	{ return Menu1200. }),
	list("[201-300]",		"menu", 	{ return Menu2300. }),
	list("[301-400]",		"menu", 	{ return Menu3400. }),
	list("[401-500]",		"menu", 	{ return Menu4500. }),
	list("[501-600]",		"menu", 	{ return Menu5600. }),
	list("[601-700]",		"menu", 	{ return Menu6700. }),
	list("[701-800]",		"menu", 	{ return Menu7800. }),
	list("[801-900]",		"menu", 	{ return Menu8900. }),
	list("[901-999]",		"menu", 	{ return Menu9900. }),
	list("",			"text"),
	list("[BACK]",			"backmenu",	{ return MasterMenu. })
).


set subMenu2 to list(
	list("Navigate to error ! for more",	"text"),
	list("information about error.123456789-123456789-12345",			"text"),
	list("",			"text"),
	list("[BACK]",			"backmenu",	{ return mainMenu. })
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
		updateLine(3).
	}

	wait 0.
}
