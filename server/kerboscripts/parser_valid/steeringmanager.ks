

function saveSteering {
	
	local lex is lexicon(
		"pitchts", steeringmanager:pitchts,
		"yawts", steeringmanager:yawts,
		"rollts", steeringmanager:rollts,
		"maxstoppingtime", steeringmanager:maxstoppingtime,
		"rollcontrolanglerange", steeringmanager:rollcontrolanglerange,
		"pitchtorqueadjust", steeringmanager:pitchtorqueadjust,
		"pitchtorquefactor", steeringmanager:pitchtorquefactor,
		"yawtorqueadjust", steeringmanager:yawtorqueadjust,
		"yawtorquefactor", steeringmanager:yawtorquefactor,
		"rolltorqueadjust", steeringmanager:rolltorqueadjust,
		"rolltorquefactor", steeringmanager:rolltorquefactor,
		"pitchpid:kp", steeringmanager:pitchpid:kp,
		"pitchpid:ki", steeringmanager:pitchpid:ki,
		"pitchpid:kd", steeringmanager:pitchpid:kd,
		"yawpid:kp", steeringmanager:yawpid:kp,
		"yawpid:ki", steeringmanager:yawpid:ki,
		"yawpid:kd", steeringmanager:yawpid:kd,
		"rollpid:kp", steeringmanager:rollpid:kp,
		"rollpid:ki", steeringmanager:rollpid:ki,
		"rollpid:kd", steeringmanager:rollpid:kd
	).
	
	local filePath is path("0:/json/" + ship:name + "/steering.json").
	writejson(lex, filePath).
}

function loadSteering {
	local filePath is path("0:/json/" + ship:name + "/steering.json").
	
	if exists(filePath) {
		local lex is readjson(filePath).
		
		set steeringmanager:pitchts to lex["pitchts"].
		set steeringmanager:yawts to lex["yawts"].
		set steeringmanager:rollts to lex["rollts"].
		set steeringmanager:maxstoppingtime to lex["maxstoppingtime"].
		set steeringmanager:rollcontrolanglerange to lex["rollcontrolanglerange"].
		set steeringmanager:pitchtorqueadjust to lex["pitchtorqueadjust"].
		set steeringmanager:pitchtorquefactor to lex["pitchtorquefactor"].
		set steeringmanager:yawtorqueadjust to lex["yawtorqueadjust"].
		set steeringmanager:yawtorquefactor to lex["yawtorquefactor"].
		set steeringmanager:rolltorqueadjust to lex["rolltorqueadjust"].
		set steeringmanager:rolltorquefactor to lex["rolltorquefactor"].
		set steeringmanager:pitchpid:kp to lex["pitchpid:kp"].
		set steeringmanager:pitchpid:ki to lex["pitchpid:ki"].
		set steeringmanager:pitchpid:kd to lex["pitchpid:kd"].
		set steeringmanager:yawpid:kp to lex["yawpid:kp"].
		set steeringmanager:yawpid:ki to lex["yawpid:ki"].
		set steeringmanager:yawpid:kd to lex["yawpid:kd"].
		set steeringmanager:rollpid:kp to lex["rollpid:kp"].
		set steeringmanager:rollpid:ki to lex["rollpid:ki"].
		set steeringmanager:rollpid:kd to lex["rollpid:kd"].
		
		return true.
	}
	else return false.
}