// For this to work you need to create at least one menu list in this format (note the extra value at the end of numbers!):
//
// local sv is -9.9993134.
// set someMenu to list(
// 		list("Some text to display",	"text"),
// 		list("_",						"line"),
// 		list("A read-only variable:",	"display", 	{ return round(ship:airspeed,1) + " m/s". }),
// 		list("A number:",				"number", 	{ parameter p is sv. if p <> sv set number1 to p. return number1. }, 10),
// 		list("Editable text:",			"string",	{ parameter p is sv. if p <> sv set string1 to p. return string1. }),
// 		list("Boolean value:",			"bool",		{ parameter p is sv. if p <> sv toggle bool1. return bool1. }),
// 		list("An action",				"action", 	{ stage. }),
// 		list("Some other menu",			"menu", 	{ return someSubMenu. }),
// 		list("The parent menu",			"backmenu", { return mainMenu. })
// ).
//
// The first three types are read-only items and can't be selected or changed by the program
// Available types:
//	text:
//			just displays the name of the item, can print across all columns.
//	line:
//			makes a horizontal line across the menu using the single character.
//	display:
//			displays what you return from the anonymous function
//	number:
//			Can be edited with A/D (in increments) with Q/E altering increment scale.
//			Can be replaced by starting to type in a number when the line is selected. Hit enter to apply it. Backspace works too.
//			Can be edited by hitting enter with the line selected.
//			Needs a get/set anonymous function like shown above.
//			Needs the variable to have been declared by you elsewhere in your main program.
//			Needs to have a increment multiplier set in it's list as shown above (a value of 10 will make the default increment 10).
//	string:
//			Can be edited by hitting enter with the line selected.
//			Needs a get/set anonymous function like shown above.
//			Needs the variable to have been declared by you elsewhere in your main program.
//	bool:
//			Can be toggled by hitting enter, A, or D
//			Needs a get/set anonymous function like shown above.
//			Needs the variable to have been declared by you elsewhere in your main program.
//	action:
//			Runs the anonymous function when you hit enter/D when it is selected
//	menu:
//			Opens another menu that you will have to link to in the function.
//	backmenu:
//			exactly like "menu" but this can also be triggered by pressing backspace

// Controls:
//	W/S/UpArrow/DownArrow: navigates the menu
//	A/D: Runs commands, increments numbers
//	Q/E: Changes number increment scale
//	Enter: Runs commands, edits numbers and strings, toggles boolean values.
//	Backspace: opens the parent menu if it exists (for submenues)
//	Typing a number: When a number is selected, typing a number will start the number editor. Enter or W/S to confirm.




//lib_menu.ks
@LAZYGLOBAL on.
runoncepath("lib_ui.ks"). //needed for some terminal drawing functions.

if not (defined startLine) local startLine is 0.		//the first menu item will start at this line in the terminal window
if not (defined startColumn) local startColumn is 3.	//menu item description starts at this x coordinate, remember to leave some space for the marker on the left
if not (defined nameLength) local nameLength is 16.		//how many characters of the menu item names to display
if not (defined valueLength) local valueLength is 12.	//how many characters of the menu item values to display

if not (defined incrOptions) local incrOptions is list (0.01,0.1,1,10,100,1000). // default increment values in ascending order (for incrementing numbers with A/D). Feel free to add or remove steps from this list


local incrI is 2.
local typingNumber is false.
local typingString is false.
local selectedLine is 0.
local lineType is "text".

local dummyMenu is list(
	list("","text"),
	list("This is a placeholder menu, if you see this you need to","text"),
	list("set the activeMenu variable to a menu list of your own","text"),
	list("","text"),
	list("<what?>","action",{ hudtext("It puts the menu in the variable or else it gets the hose again",5, 4, 35, red, false). })
).

// !! activeMenu is a varaible that should contain the list that defines the menu that you want to display !!
if not (defined activeMenu) global activeMenu is dummyMenu.
local lastMenu is activeMenu.

// ### Drawing stuff to terminal ###
// >>
//draw the menu
function drawAll {

	//clearscreen.

	terminal:input:clear(). //clear inputs for new menues just in case..
	set selectedLine to 0.
	set lineType to activeMenu[selectedLine][1].

	//column starts
	set C1 to startColumn.
	set C2 to C1 + nameLength.
	set C3 to C2 + valueLength.

	clearBox(startLine,startLine + lastMenu:length - 1,C1,C3). //clear the last menu. This won't clear anything else on the terminal


	local notFoundSelectable is true.
	local i is 0.
	inputs().
	until i = activeMenu:length {
		if notFoundSelectable and not readOnlyTypes:contains(activeMenu[i][1]) { //skip read only lines
			set selectedLine to i.
			set notFoundSelectable to false.
		}
		updateLine(i).

		//debug info about your current menu, uncomment to display it below your menu:
		//print activeMenu[i][0] + " = " + activeMenu[i][1] at (1,startLine + activeMenu:length + 2 + i).

		set i to i + 1.
	}
	drawMarker().
}

local markerStr is ">> ".
local markerTimer is time:seconds + 900000.
function drawMarker {
	print markerStr at (C1-3,startLine + selectedLine). //print the arrow that displays the active selection

	//print relevant information at the end of the current line
	if lineType = "number" {
		set suffixString to "-+" + incrOptions[incrI] * activeMenu[selectedLine][3].
		print suffixString at (C3 + 1,startLine + selectedLine).
	}
	else if lineType = "bool" {
		set suffixString to activeMenu[selectedLine][2]():tostring().
		print suffixString at (C3 + 1,startLine + selectedLine).
	}
}

function clearMarkers {
	print "   " at (C1-3,startLine + selectedLine).

	if lineType = "number" or lineType = "bool" {
		local emptyString is "                             ".
		print emptyString:substring(0,suffixString:length) at (C3 + 1,startLine + selectedLine).
	}
}
// <<

// ### Input and value handling ###
// >>

local readOnlyTypes is list("text","display","line").

function inputs {
	if typingNumber { //currently recording numbers, so ignore all other commands
		updateLine(selectedLine,numberString).
		if terminal:input:haschar() {
			local inp is terminal:input.
			local ch is inp:getchar().
			if ch:tonumber(99) <> 99 or ch = "." or ch = "-" {
				set numberString to numberstring + ch.

			}
			else if ch = inp:backspace {
				if numberString:length > 0 set numberString to numberString:remove(numberString:length-1,1).
			}
			else if ch = inp:enter or ch = "d" or ch = "w" or ch = "s"{
				set typingNumber to false.
				local converted is numberString:tonumber(-9999).
				if converted <> -9999 { //valid
					updateLine(selectedLine,numberString).
					activeMenu[selectedLine][2](converted). //change the actual variable through the function stored in the lex
				}
				set numberString to "".
				updateLine(selectedLine).
			}
		}
	}
	else if typingString { //currently recording text
		updateLine(selectedLine,stringString).
		if terminal:input:haschar() {
			local inp is terminal:input.
			local ch is inp:getchar().

			if ch = inp:enter {
				set typingString to false.
				updateLine(selectedLine,stringString).
				activeMenu[selectedLine][2](stringString).
				set stringString to "".
			}
			else if ch = inp:backspace {
				if stringString:length > 0 set stringString to stringString:remove(stringString:length-1,1).
			}
			else set stringString to stringString + ch.
		}
	}

	else if terminal:input:haschar() { //not recording, so enable all other commands
		local inp is terminal:input.
		local ch is inp:getchar().
		set lineType to activeMenu[selectedLine][1].

		local oldLine is selectedLine.
		if ch = "w" or ch = inp:upcursorone {
			clearMarkers().

			set selectedLine to selectedLine - 1.
			if selectedLine < 0 set selectedLine to activeMenu:length - 1.
			//until activeMenu[selectedLine][1] <> "text" and activeMenu[selectedLine][1] <> "line" { //skip text lines as they have no values
			until not readOnlyTypes:contains(activeMenu[selectedLine][1]) {
				set selectedLine to selectedLine - 1.
				if selectedLine < 0 set selectedLine to activeMenu:length - 1.
			}

			set incrI to 2.
			updateLine(oldLine).
		}
		else if ch = "s" or ch = inp:downcursorone {
			clearMarkers().
			set selectedLine to selectedLine + 1.
			if selectedLine >= activeMenu:length set selectedLine to 0.
			//until activeMenu[selectedLine][1] <> "text" and activeMenu[selectedLine][1] <> "line" { //skip text lines as they have no values
			until not readOnlyTypes:contains(activeMenu[selectedLine][1]) {
				set selectedLine to selectedLine + 1.
				if selectedLine >= activeMenu:length set selectedLine to 0.
			}

			set incrI to 2.
			updateLine(oldLine).
		}
		else if ch = "a" or ch = inp:leftcursorone adjust(-1).
		else if ch = "d" or ch = inp:rightcursorone adjust(1).
		else if ch = "q" { set incrI to max(0,incrI - 1). }
		else if ch = "e" { set incrI to min(incrOptions:length - 1,incrI + 1). }
		else if lineType = "number" and (ch:tonumber(99) <> 99 or ch = "-" or ch = inp:enter) {
			set typingNumber to true.
			if ch = inp:enter set numberString to activeMenu[selectedLine][2]():tostring().
			else set numberString to ch.
		}
		else if ch = inp:enter {
			if lineType = "menu" or lineType = "backmenu" or lineType = "bool" or lineType = "action" adjust(0).
			else if lineType = "string" {
				set stringString to activeMenu[selectedLine][2]().
				set typingString to true.
			}
			//else if lineType = "action" activeMenu[selectedLine][2]().
		}
		else if ch = inp:backspace {
			local i is 0.
			until i >= activeMenu:length {
				if activeMenu[i][1] = "backmenu" {
					set selectedLine to i.
					adjust(1).
					set i to activeMenu:length.
				}
				set i to i + 1.
			}
		}

		set lineType to activeMenu[selectedLine][1].
		clearMarkers().
		drawMarker().
		updateLine(selectedLine).

		inp:clear().
	}

	if time:seconds > markerTimer + 0.2 { set markerStr to ">> ". set markerTimer to time:seconds + 900000. drawMarker(). }

}

set blink to 0.
function updateLine {
	parameter line,val is "x".
	local nameStr is activeMenu[line][0].
	local valType is activeMenu[line][1].

	local finalStr is "".

	if valType = "text" or valType = "action" {
		set finalStr to nameStr.
	}
	else if valType = "line" {
		set finalStr to "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx".
		local tableWidth is C3-C1.
		set finalStr to finalStr:substring(0,tableWidth).
		set finalStr to finalStr:replace("x",nameStr).
	}
	else {
		if val = "x"  {
			set val to activeMenu[line][2]().
			if valType = "number" set val to val:tostring().
		}

		local blinkStr is "".
		if (typingNumber or typingString) and line = selectedLine { //blinking cursor when typing in
			if blink < 10 set blinkStr to "_".
			else set blinkStr to " ".
			set blink to blink + 1.
			if blink > 20 set blink to 0.
		}

		local valStr is "".

		if valType = "bool" {
			if val set valStr to "[ X ]".
			else set valStr to   "[   ]".
		}
		else if valType = "number" {
			//if not typingNumber and val:tonumber(-99.9999) <> -99.9999 and val:tonumber() > 9999 set valStr to round(val:tonumber() / 1000,1) + "K".
			if not typingNumber and val > 9999 set valStr to round(val:tonumber() / 1000,1) + "K".
			else set valStr to val:tostring + blinkStr.
		}
		else if valType = "string" or valType = "display" {
			set val to val + blinkStr.
			set valStr to val:substring(max(0,val:length - (C3-C2)),min(val:length,C3-C2)).
		}
		set valStr to valStr:padleft(C3-C2).
		set finalStr to nameStr:padright(C2-C1):substring(0,C2-C1) + valStr.
	}

	print finalStr at (C1,startLine + line).
}

function adjust {
	parameter sign.
	local func is activeMenu[selectedLine][2].
	set lineType to activeMenu[selectedline][1].

	set markerStr to "> >".
	set markerTimer to time:seconds.

	if lineType = "number" {
		func(func() + sign * incrOptions[incrI] * activeMenu[selectedLine][3]).
	}
	else if lineType = "bool" {
		func(1).
	}
	else if lineType = "menu" or lineType = "backmenu" { // d
		clearMarkers().
		set lastMenu to activeMenu.
		set activeMenu to func().
		drawAll().
		set markerTimer to 0.
	}
	else if lineType = "action" func().


}

// <<
