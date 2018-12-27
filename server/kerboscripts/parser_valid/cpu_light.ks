//function to set the kos cpu's light, if it has one.

//find the module and store it for later
local cpuPart is core:part.
local lightParts is ship:partstagged("light").
local kosLightMods is list().
local hasLights is false.
getLightModule(cpuPart).

if lightParts:length > 0 {
	for p in lightParts {
		getLightModule(p).
	}
}

function getLightModule {
	parameter p.
	for ms in p:modules {
		local m is p:getmodule(ms).
		if m:hasfield("light r") and m:hasfield("light g") and m:hasfield("light b")  { //not really necessary to check all but why not
			set hasLights to true.
			kosLightMods:add(m).
		}
	}
}

function setLights {
	parameter r,g,b.
	
	if hasLights {
		//only takes a value between 0 and 1
		//set r to max(0,min(1,r)).
		//set g to max(0,min(1,g)).
		//set b to max(0,min(1,b)).
		
		for m in kosLightMods {
			m:setfield("light r",r).
			m:setfield("light g",g).
			m:setfield("light b",b).
		}
	}
}

if hasLights {
	setLights(1,1,1).
}