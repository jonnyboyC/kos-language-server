local e is constant():e.

// Thanks to Dunbaratu for the two following functions!
function burn_duration {
	parameter delta_v_mag, m0 is ship:mass. 
	
	local g0 is 9.802. 
  
	// The ISP of first engine found active:
	// (For more accuracy with multiple differing engines,
	// some kind of weighted average would be needed.)
	local ISP is simple_isp().
	
	// mass after burn is done
	local m1 is m0*e^(-delta_v_mag / (g0*ISP)).
	
	// From rocket equation, and definition of ISP:
	local burn_dur is (g0*ISP*m0/SHIP:AVAILABLETHRUST)*( 1 - e^(-delta_v_mag/(g0*ISP)) ).
	
	return list(burn_dur,m1).
}

function simple_isp {
	list engines in engs.
	local totalFlow is 0.
	local totalThrust is 0.
	for eng in engs {
		if eng:ignition and not eng:flameout {
			set totalflow to totalflow + (eng:availablethrust / eng:isp).
			set totalthrust to totalthrust + eng:availablethrust.
		}
	}
	return totalthrust / max(0.1, totalflow).
}

function half_dv_duration {
	parameter deltav_mag.
	
	local first_half is burn_duration(deltav_mag / 2).
	local first_half_duration is first_half[0].
	
	// the duration of the second half of the burn, with the adjusted starting mass.
	local second_half is burn_duration(deltav_mag / 2, first_half[1]).
	
	
	// return list with: first half of deltaV duration, last half of dV duration, mass after full burn.
	return list(first_half_duration,second_half[0],second_half[1]).
}