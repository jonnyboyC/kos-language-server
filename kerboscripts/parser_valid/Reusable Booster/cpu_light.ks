//function to set the kos cpu's light, if it has one.

//find the module and store it for later
local lightParts is ship:partstagged("light").
local kosLightMods is list().
local hasLights is false.
getLightModule(core:part).

if lightParts:length > 0 {
	for p in lightParts {
		getLightModule(p).
	}
}

function getLightModule {
	parameter p.
	for ms in p:modules {
		local m is p:getmodule(ms).
		if m:hasfield("light r") {
			set hasLights to true.
			kosLightMods:add(m).
		}
	}
}

function setLights {
	parameter r,g,b.
	
	if hasLights {	
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