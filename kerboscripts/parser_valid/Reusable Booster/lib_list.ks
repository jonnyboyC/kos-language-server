// #########################################
// ############ Scrolling list #############

@LAZYGLOBAL on.
runoncepath("lib_UI.ks"). //needed for some terminal drawing functions.

global list_menu is list("").
//global lib_list_active is true.

//declare some vars and default values
local listmenu_dimensions is lexicon(
	"startColumn",	0,
	"endColumn",	1,
	"startLine",	0,
	"endLine",		1,
	"columns",		1,
	"lines",		1
).

// important: this must be called after loading this library
function list_position { //parameters: start col, end col, start line, end line.
	parameter sc,ec,sl,el.
	set listmenu_dimensions["startColumn"] to sc.
	set listmenu_dimensions["endColumn"] to ec.
	set listmenu_dimensions["startLine"] to sl.
	set listmenu_dimensions["endLine"] to el.
	
	set listmenu_dimensions["columns"] to listmenu_dimensions["endColumn"] - listmenu_dimensions["startColumn"] + 1.
	set listmenu_dimensions["lines"] to listmenu_dimensions["endLine"] - listmenu_dimensions["startLine"] + 1.
}

function add_entry {
	parameter str_entry.
	list_menu:add(str_entry).
	parse_entry(str_entry).
	
	
	
	draw_list().
}

local print_list is list().
function parse_list {
	print_list:clear.
	for entry in list_menu {
		parse_entry(entry).
	}
}

local indent is "".
function set_indentation {
	parameter length.
	set indent to "".
	local i is 0.
	until i = length {
		set indent to indent + " ".
		set i to i + 1.
	}
}

function parse_entry {
	parameter str.
	local words is str:split(" ").
	local str_list is list("").
	local i is 0.
	for word in words {
		if word:length + str_list[i]:length <= listmenu_dimensions["columns"] set str_list[i] to str_list[i] + word + " ".
		else {
			set i to i + 1.
			str_list:add(indent + word + " ").
		}
	}
	str_list:add("").
	
	local i is str_list:length - 1.
	until i < 0 {
		print_list:insert(0,str_list[i]:trimend()).
		set i to i - 1.
	}
}

function draw_list {
	clearBox(listmenu_dimensions["startLine"],listmenu_dimensions["endLine"],listmenu_dimensions["startColumn"],listmenu_dimensions["endColumn"]).
	
	local i is 0.
	until i = print_list:length or i = listmenu_dimensions["lines"] {
		print print_list[i] at (listmenu_dimensions["startColumn"],listmenu_dimensions["startLine"] + i).
		set i to i + 1.
	}
}