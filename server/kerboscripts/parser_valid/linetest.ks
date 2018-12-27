runoncepath("lib_list.ks").
list_position(0,round(terminal:width*0.75)-1,10,terminal:height-4).
clearscreen.

local wordlist is list("Lorem","ipsum","dolor",
"sit","amet","consectetur","adipiscing","elit",
"sed","do","eiusmod","tempor","incididunt",
"ut","labore","et","dolore","magna",
"aliqua","nisi").

set oldHeight to terminal:height.
set oldWidth to terminal:width.

function drawlines {
	horizontalLine(9,"-").
	verticalLineTo(round(terminal:width*0.75),10,terminal:height - 1,"|").
	horizontalLineTo(terminal:height-3,0,round(terminal:width*0.75),"-").
}

print "test".
drawlines().

ag1 on.
until false {
	if ag1 {
		ag1 off.
		
		local entry_str is "".
		local i is 0.
		until i > max(2,random() * 80) {
			local word is round((wordlist:length-1) * random()).
			set entry_str to entry_str + wordlist[word].
			local rand is random().
			if rand <= 0.01 set entry_str to entry_str + "! ".
			else if rand <= 0.1 set entry_str to entry_str + ". ".
			else if rand <= 0.25 set entry_str to entry_str + ", ".
			else set entry_str to entry_str + " ".
			set i to i + 1.
		}
		
		add_entry(entry_str:trimend() + ".").
		
		print "ADDED: " + entry_str at (0,0).
	}
	
	if terminal:height <> oldHeight or terminal:width <> oldWidth {
		list_position(0,round(terminal:width*0.75)-1,10,terminal:height-4).
		clearscreen.
		drawlines().
		parse_list().
		draw_list().
		
		set oldHeight to terminal:height.
		set oldWidth to terminal:width.
	}
	
	wait 0.
}