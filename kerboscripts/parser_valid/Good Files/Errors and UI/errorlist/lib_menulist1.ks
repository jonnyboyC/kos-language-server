set Menu0100 to list(
  list("Surface error",			"text"),
  list("-",			"line"),
	list("[001-010]",		"menu", 	{ return subMenu2. }),
	list("[BACK]",			"backmenu",	{ return mainMenu. }) //the backmenu should point back to the parent menu (so when you press backspace the script will know what menu to send you back to)
).

set Menu1200 to list(
  list("In flight error",			"text"),
  list("-",			"line"),
	list("[001-010]",		"menu", 	{ return subMenu2. }),
	list("[BACK]",			"backmenu",	{ return mainMenu. }) //the backmenu should point back to the parent menu (so when you press backspace the script will know what menu to send you back to)
).

set Menu2300 to list(
  list("Resource error",			"text"),
  list("-",			"line"),
	list("[001-010]",		"menu", 	{ return subMenu2. }),
	list("[BACK]",			"backmenu",	{ return mainMenu. }) //the backmenu should point back to the parent menu (so when you press backspace the script will know what menu to send you back to)
).

set Menu3400 to list(
  list("Rendezvous/Docking error",			"text"),
  list("-",			"line"),
	list("[001-010]",		"menu", 	{ return subMenu2. }),
	list("[BACK]",			"backmenu",	{ return mainMenu. }) //the backmenu should point back to the parent menu (so when you press backspace the script will know what menu to send you back to)
).

set Menu4500 to list(
  list("-",			"line"),
	list("[001-010]",		"menu", 	{ return subMenu2. }),
	list("[BACK]",			"backmenu",	{ return mainMenu. }) //the backmenu should point back to the parent menu (so when you press backspace the script will know what menu to send you back to)
).

set Menu5600 to list(
  list("Empty",			"text"),
  list("-",			"line"),
	list("[001-010]",		"menu", 	{ return subMenu2. }),
	list("[BACK]",			"backmenu",	{ return mainMenu. }) //the backmenu should point back to the parent menu (so when you press backspace the script will know what menu to send you back to)
).

set Menu6700 to list(
  list("Empty",			"text"),
  list("-",			"line"),
	list("[001-010]",		"menu", 	{ return subMenu2. }),
	list("[BACK]",			"backmenu",	{ return mainMenu. }) //the backmenu should point back to the parent menu (so when you press backspace the script will know what menu to send you back to)
).

set Menu7800 to list(
  list("Empty",			"text"),
  list("-",			"line"),
	list("[001-010]",		"menu", 	{ return subMenu2. }),
	list("[BACK]",			"backmenu",	{ return mainMenu. }) //the backmenu should point back to the parent menu (so when you press backspace the script will know what menu to send you back to)
).

set Menu8900 to list(
  list("Empty",			"text"),
  list("-",			"line"),
	list("[001-010]",		"menu", 	{ return subMenu2. }),
	list("[BACK]",			"backmenu",	{ return mainMenu. }) //the backmenu should point back to the parent menu (so when you press backspace the script will know what menu to send you back to)
).

set Menu9900 to list(
  list("Internal error",			"text"),
  list("-",			"line"),
	list("[001-010]",		"menu", 	{ return subMenu2. }),
	list("[BACK]",			"backmenu",	{ return mainMenu. }) //the backmenu should point back to the parent menu (so when you press backspace the script will know what menu to send you back to)
).
