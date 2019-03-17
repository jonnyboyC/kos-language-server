function save_json {
	local l is lexicon().
	
	l:add("forceDock",forceDock).
	l:add("autoFuel",autoFuel).
	l:add("autoLand",autoLand).
	l:add("agressiveChase",agressiveChase).
	l:add("speedlimitmax",speedlimitmax).
	
	//switch to 1.
	if not isDocked {
		local filename is "0:vessels/" + ship:name + ".json".
		WRITEJSON(l, filename).
	}
	//switch to 0.
}

function load_json {
	//switch to 1.
	local filename is "0:vessels/" + ship:name + ".json".
	if not isDocked and exists(filename) {
		local lex is readjson(filename).
		
		
		global forceDock is lex["forceDock"].
		global autoFuel is lex["autoFuel"].
		global autoLand is lex["autoLand"].
		global agressiveChase is lex["agressiveChase"].
		
		//if lex["forceDock"] = "True" set forceDock to true.
		//else if lex["forceDock"] = "False" set forceDock to false.
		if lex["autoFuel"] = "True" set autoFuel to true.
		else if lex["autoFuel"] = "False" set autoFuel to false.
		if lex["autoLand"] = "True" set autoLand to true.
		else if lex["autoLand"] = "False" set autoLand to false.
		if lex["agressiveChase"] = "True" set agressiveChase to true.
		else if lex["agressiveChase"] = "False" set agressiveChase to false.
		
		global speedlimitmax is lex["speedlimitmax"].
		entry("Config file was loaded.").
	}
	//switch to 0.
}