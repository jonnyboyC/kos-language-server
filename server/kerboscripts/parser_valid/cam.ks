// ### Functions ###
// >>
	function vecToHdg {
		parameter v.
		set v to vxcl(up:vector,v).
		
		local ang is vang(north:vector,v).
		if vdot(heading(90,0):vector,v) < 0 set ang to -ang.
		
		return ang.
		//return ang * constant():pi / 180. //return in radians
	}

	function vecToPitch {
		parameter v.
		
		local ang is vang(-up:vector,v) - 90.
		
		return -ang.
		//return ang * constant():pi / 180.
	}

// <<

global hasCamAddon is addons:available("camera").

if hasCamAddon {
	global extcam is addons:camera:flightcamera.
	//set extcam:camerafov to 70.
	
	local ev is v(0,0,0).
	global camAvgList is list().
	global camAvgFrames is 30.  
	global camAvgI is 0.
	for i in range(camAvgFrames) camAvgList:add(ev).
	
}