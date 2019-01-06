parameter nn is nextnode.
HUDTEXT("Starting execute node script.", 4, 2, 30, yellow, false).

runoncepath("lib_rocket_utility.ks").

sas off.
set th to 0.
lock throttle to th.
lock steering to lookdirup(nn:deltav, ship:facing:topvector). //points to node, keeping roll the same.

local burn_stats is half_dv_duration(nn:deltav:mag).
local first_half_duration is burn_stats[0].
local burn_duration is first_half_duration + burn_stats[1].

set kuniverse:timewarp:warp to 0.

set node_time to time:seconds + nn:eta.
set warp_target to node_time - 15 - first_half_duration.

wait until vang(facing:vector, steering:vector) < 1 or time:seconds >= warp_target.






HUDTEXT("Estimated burn duration: " + round(burn_duration,1) + "s", 15, 2, 20, yellow, false).


		
if warp_target > time:seconds {
	set kuniverse:timewarp:mode to "rails".
	wait 0.
	kuniverse:timewarp:warpto(warp_target).
}



wait until nn:eta - first_half_duration <= 0. //wait until we are close to executing the node
set kuniverse:timewarp:mode to "physics". //se we can manually physics warp during a burn

HUDTEXT("Begin burn. Physics warp is possible.", 5, 2, 20, yellow, false).

set dv0 to nn:deltav.

local done is false.
until done {
	set max_acc to ship:availablethrust/ship:mass.
	if nn:deltav:mag/(max_acc*10) < 1 set warp to 0. //warp
	
	if vang(facing:vector, steering:vector) > 1 { set th to 0. }
	else { set th to min(nn:deltav:mag/(max_acc*1.2), 1). }
	
	
	LIST engines IN engs.
	for eng in engs { if eng:ignition = true and eng:flameout = true and stage:ready { stage. } }
	
	if nn:deltav:mag < 0.05 set done to true.
	wait 0.
}

HUDTEXT("Manouver mode has been executed!", 4, 2, 30, yellow, false).

set kuniverse:timewarp:mode to "rails".
unlock steering.
set th to 0.
unlock throttle.
set ship:control:pilotmainthrottle to 0.
remove nn.