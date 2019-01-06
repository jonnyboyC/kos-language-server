@LAZYGLOBAL on.

//modes
global m_hover is 2.
global m_land is 3.
global m_free is 4.
global m_bookmark is 5.
global m_pos is 6.
global m_follow is 7.
global m_patrol is 8.
global m_race is 9.
global m_fuel is 99.

function mode_string {
	if mode = m_hover return "hover".
	else if mode = m_land return "landing".
	else if mode = m_free return "freeroam".
	else if mode = m_pos return "position".
	else if mode = m_follow return "following " + tarVeh:name.
	else if mode = m_fuel return "refuel".
	else if mode = m_patrol return "patrolling".
	else if mode = m_race return "in race".
	else return "error".
}

function reverseLimit {
	parameter lex,limit,isPosEng.
	local reverseMod is lex["reverseMod"].
	local eng is lex["part"].
	local doReverse is false.
	
	//if isPosEng {
		if limit < -100 {
			set doReverse to true.
			if not(lex["inReverse"]) {
				reverseMod:doevent("Set Reverse Thrust").
				set lex["inReverse"] to true.
			}
			set limit to -limit - 200. 
			//limit is -200, = 0 + 100 = 100
			//limit is -101, = -99 + 100 = 1
		}
		else {
			if lex["inReverse"] {
				reverseMod:doevent("Set Normal Thrust").
				set lex["inReverse"] to false.
			}
		}
	//}
	
	set eng:thrustlimit to min(100, 100 + limit).
	
	return lex.
}

function dockSearch {
	parameter checkPart,originPart. //checkPart is the current part the function is working on, originPart is the part that called it (a child or parent).
	set result to core:part.
	
	for dockpart in core:element:dockingports {
		if checkPart = dockpart { set result to checkPart. } //found a match!
	}
	
	if result = core:part {	//while this is true, a match hasn't been found yet
		if checkPart:hasparent {
			if not(checkPart:parent = originPart) {
				set tempResult to dockSearch(checkPart:parent,checkPart).
				if not(tempResult = core:part) set result to tempResult. //parent returned a match.
			}
		}
		if checkPart:children:length > 0 and result = core:part {
			for child in checkPart:children {
				if not(child = originPart) and result = core:part {
					set tempResult to dockSearch(child,checkPart).
					if not(tempResult = core:part) set result to tempResult. //child returned a match.
				}
			}
		}
	}
	return result. //return the result to the caller (part or initial call from script)
}

function sortTargets {
	local sorted is list().
	list targets in tgs.
	
	local i is 0.
	local limited is false.
	
	local lowestTarget is 0.
	until i = tgs:length or i = 10 {
		local isValid is false.
		local lowestValue is 100000.
		for t in tgs {
			local tDistance is t:distance.
			if t:body = ship:body and tDistance < lowestValue and not sorted:contains(t) {
				set lowestValue to tDistance.
				set lowestTarget to t.
				set isValid to true.
			}
		}
		set i to i + 1.
		
		if isValid sorted:add(lowestTarget).
	}
	return sorted.
}

function targetStrings {
	parameter tgs. //list of vessels
	local stringList is list("").
	for t in tgs {
		stringList:add(t:name).
	}
	return stringList.
}

// parameter 1: A string or index number based on the list below.
// returns: a geoposition
function geo_bookmark {
	parameter bookmark.
	
	
	if bookmark = 1 or bookmark = "LAUNCHPAD" or bookmark = "KSC" return LATLNG(-0.0972078822701718, -74.5576864391954). //Kerbal space center
	else if bookmark = 2 or bookmark = "RUNWAY E" return LATLNG(-0.0502131096942382, -74.4951289901873). //East
	else if bookmark = 3 or bookmark = "RUNWAY W" return LATLNG(-0.0486697432694389, -74.7220377114077). //West
	else if bookmark = 4 or bookmark = "VAB" return LATLNG(-0.0967646955755359, -74.6187122587352). //VAB Roof
	
	else if bookmark = 5 or bookmark = "IKSC" return latlng(20.3926,-146.2514). //inland kerbal space center
	else if bookmark = 6 or bookmark = "ISLAND W" return LATLNG(-1.5173500701556, -71.9623911214353). //Island/airfield runway west
	else if bookmark = 7 or bookmark = "ISLAND E" return LATLNG(-1.51573303823027, -71.8571463011229).//Island/airfield runway east
	else if bookmark = 8 or bookmark = "POOL" return LATLNG(-0.0867719193943464, -74.6609773699654).
	//else if bookmark = "" return .
	
	
	else { print "ERROR: geolocation bookmark " + bookmark + " not found!". return latlng(90,0). }
}

//////////////////// User Interface stuff /////////////////// 
function toggleTerVec {
	parameter var.
	set terMark to var.
	
	local i is 1.
	until i = 6 {
		set pm to pList[i].
		set vecs[pm]:show to terMark.
		set i to i + 1.
	}
}
function toggleVelVec {
	parameter var.
	set stMark to var.
	if submode = m_free {
		set vecs[markHorV]:show to true.
		set vecs[markDesired]:show to true.
	}
	else {
		set vecs[markHorV]:show to stMark.
		set vecs[markDesired]:show to stMark.
	}
}
function toggleThrVec {
	parameter var.
	set thMark to var.
	set i to 0.
	for eng in engs {
		set vecs[i]:show to thMark.
		set i to i + 1.
	}
}
function toggleAccVec {
	parameter var.
	set miscMark to var.
	set vecs[markTar]:show to miscMark.
	//set vecs[markAcc]:show to miscMark.
}

function popup {
	parameter s.
	HUDTEXT(s, 5, 2, 40, yellow, false).
	if addons:available("tts") addons:tts:say(s).
	
	// context: HUDTEXT( Message, delaySeconds, style, size, colour, boolean doEcho).
	//style: - 1 = upper left - 2 = upper center - 3 = lower right - 4 = lower center
}
function warning {
	parameter s.
	HUDTEXT(s, 5, 2, 60, red, false).
	if addons:available("tts") addons:tts:say("Warning!" + s).
	
	// context: HUDTEXT( Message, delaySeconds, style, size, colour, boolean doEcho).
	//style: - 1 = upper left - 2 = upper center - 3 = lower right - 4 = lower center
}


/////////////////////// VECTORS ///////////////////////////

// vecs_clear().
function vecs_clear {
	if vecs:length > 0 {
		for vd in vecs {
			set vd:SHOW TO false.
		}
		vecs:clear.
	}
}

// set [variable] to vecs_add([position],[vector],[color],[string]).
// returns: list index. 
// example: 
//  Create a vecdraw:
//  set velocityVec to vecs_add(ship:position,velocity:orbit,blue,round(velocity:orbit:mag) + " m/s").
//  Update it's starting position:
//  set vecs[velocityVec]:start to ship:position.
function vecs_add {
	parameter p,v,c,descr,w.
	vecs:add(VECDRAWARGS(p, v, c, descr, 1, false,w)).
	return vecs:length - 1.
}
function vecs_add_v {
	parameter p,v,c,descr,w.
	vecs:add(VECDRAWARGS(p, v, c, descr, 1, true,w)).
	return vecs:length - 1.
}

global vecs is list().
if vecs:length > 0 vecs_clear().

////////////////////////////////////////////////////////// 

function nz { //"not zero" , NaN protection
	parameter float.
	if abs(float) < 0.001 {
		set float to 0.001.
	}
	return float.
}
local c_pi is constant:pi.
function toRad {
	parameter n.
	return n * (c_pi / 180).
}


