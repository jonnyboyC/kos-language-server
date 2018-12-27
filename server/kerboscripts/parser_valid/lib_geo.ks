//parameter 1: geoposition
//parameter 2: time in seconds into the future
//returns: A list:
//           index 0: geoposition's position relative to ship in t seconds, only remains valid for the time it was called.
//           index 1: geoposition's position relative to body in t seconds. The more useful one, as it remains valid.
function geo_posAt {
	parameter geopos,t.
	local rotang is body:angularvel:mag * (180/constant():pi) * t. //convert to degrees per seconds and multiply by time (in seconds)
	local rotdir is angleaxis(rotang,body:angularvel).
	local geoposUP is geopos:position - body:position.
	local newposUP is rotdir * geoposUP.
	local newpos is newposUP + body:position.
	
	return list(newpos,newposUP). //first is relative to ship (right now), second is relative to body
}

// parameter 1: Latitude at which to check for orbit itersections.
// returns: A list, where index 0 is a true if intersections were found, and index 1 and 2 contain intersection vectors. Useful for planning landing to specific geopositions.
function geo_lat_intersect {
	parameter targetLat.
	if abs(targetLat) > obt:inclination and obt:inclination < 90 { 
		print "ERROR: latitude " + targetLat + " is not possible to reach with orbit!".
		local returnlist is list(false).
		return returnlist. 
	}
	
	local orbnormal is -vcrs(velocity:orbit,obt:position-body:position):normalized.
	local bodynormal is body:angularvel:normalized.
	local AnDnAxis is vcrs(orbnormal,bodynormal):normalized * body:position:mag. //points to ascending or descending node
	if body:geopositionof(angleaxis(90,orbnormal) * AnDnAxis):lat < 0 set AnDnAxis to -AnDnAxis. //Switch to AN in case it is DN
	if targetLat < 0 set AnDnAxis to -AnDnAxis. //if target lat is south, start search from DN.
	
	local crossvec is AnDnAxis.
	//local markAnDn is vecs_add(body:position,AnDnAxis,rgb(0,1,0),"AN/DN").
	//local markCross is vecs_add(body:position,crossvec,rgb(0,0,1),"Intercept").
	local returnlist is list().
	returnlist:add(true).
	local mode is 0.
	until mode = 2 {
		local testlat is body:geopositionof(crossvec + body:position):lat.
		if abs(testlat - targetLat) < 0.0001 {
			set mode to mode + 1.
			returnlist:add(crossvec:vec).
			set crossvec to angleaxis(0.0003,orbnormal) * crossvec.
		}
		else {
			set crossvec to angleaxis(abs(testlat - targetLat)/50,orbnormal) * crossvec.
			//set vecs[markCross]:vec to crossvec.
		}
	}
	
	
	//local markinc0 is vecs_add(body:position,bodynormal * body:position:mag,rgb(0,1,1),"").
	//local markorbnorm is vecs_add(body:position,orbnormal * body:position:mag,rgb(1,0,1),"").
	wait 2.
	//vecs_clear().
	return returnlist. //relative to body, not ship
}


// parameter 1: a geoposition ( ship:GEOPOSITION / body:GEOPOSITIONOF(position) / LATLNG(latitude,longitude) )
// parameter 2: size/"radius" of the triangle. Small number gives a local normalvector while a larger one will tend to give a more average normalvector.
// returns: Normalvector of the terrain. (Can be used to determine the slope of the terrain.)
function geo_normalvector {
	parameter geopos,size_.
	set size to max(5,size_).
	local center is geopos:position.
	local fwd is vxcl(center-body:position,body:angularvel):normalized.
	local right is vcrs(fwd,center-body:position):normalized.
	local p1 is body:geopositionof(center + fwd * size_ + right * size_).
	local p2 is body:geopositionof(center + fwd * size_ - right * size_).
	local p3 is body:geopositionof(center - fwd * size_).
	
	local vec1 is p1:position-p3:position.
	local vec2 is p2:position-p3:position.
	local normalVec is vcrs(vec1,vec2):normalized.
	
	//debug vecdraw: local markNormal is vecs_add(center,normalVec * 300,rgb(1,0,1),"slope: " + round(vang(center-body:position,normalVec),1) ).

	return normalVec.
}

// parameter 1: a geoposition ( ship:GEOPOSITION / body:GEOPOSITIONOF(position) / LATLNG(latitude,longitude) )
// returns: The surface velocity VECTOR of the geoposition. Combine with :MAG to get the scalar value.
function geo_surface_vel {
	parameter geopos.
	local pos is geopos:position.
	local posVec is pos - body:position.
	local eqRadius is vxcl(body:angularvel,posVec):mag. //radius from polar axis
	local surf_vel is -vcrs(posVec,body:angularvel). //direction
	set surf_vel:mag to (2*constant():pi*eqRadius)/body:rotationperiod.
	return surf_vel. //vector with direction and magnitude of geoposition's surface velocity
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