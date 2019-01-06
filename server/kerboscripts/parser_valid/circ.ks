//circularization script, starts immediately when called.
parameter method is "engines".

sas off.
set th to 0.
lock throttle to th.
set dV to ship:facing:vector:normalized.
if method = "rcs" {
	lock steering to "kill".
	set old_rcs to rcs.
	rcs on.
}
else lock steering to lookdirup(dV, ship:facing:topvector).

local timeout is time:seconds + 9000.
when dV:mag < 0.05 then { set timeout to time:seconds + 10. return false. }
until dV:mag <= 0.001 or time:seconds > timeout {
	set posVec to ship:position - body:position.
	set vecNormal to vcrs(posVec,velocity:orbit).
	set vecHorizontal to -1 * vcrs(ship:position-body:position, vecNormal).
	set vecHorizontal:mag to sqrt(body:MU/(body:Radius + altitude)).
	
	set dV to vecHorizontal - velocity:orbit. //deltaV as a vector
	
	//Debug vectors
	//set mark_n to VECDRAWARGS(ship:position, vecNormal:normalized * (velocity:orbit:mag / 100), RGB(1,0,1), "n", 1, true).
	//set mark_h to VECDRAWARGS(ship:position, vecHorizontal / 100, RGB(0,1,0), "h", 1, true).
	//set mark_v to VECDRAWARGS(ship:position, velocity:orbit / 100, RGB(0,0,1), "dv", 1, true).
	set mark_dv to VECDRAWARGS(ship:position, dV * 10, RGB(1,1,1), "dv: " + round(dv:mag,3) + "m/s", 1, true,0.2).
	
	if method = "rcs" {
		set dV:mag to min(dV:mag * 5,1)^0.75.
		//set ship:control:fore to -pid1:update(time:seconds,vdot(facing:vector,dV)).
		//set ship:control:top to -pid2:update(time:seconds,vdot(facing:topvector,dV)).
		//set ship:control:starboard to -pid3:update(time:seconds,vdot(facing:starvector,dV)).
		
		set ship:control:fore to vdot(facing:vector,dV).
		set ship:control:top to vdot(facing:topvector,dV).
		set ship:control:starboard to vdot(facing:starvector,dV).
	}
	else {
		//throttle control
		set max_acc to ship:maxthrust / ship:mass.
		set angvel to ship:angularvel:mag *  (180/constant():pi).
		if vang(ship:facing:vector,dV) > 1 or angvel > 3 { set th to 0. }
		else { set th to dV:mag/ (max_acc * 1). }
	}
	
	
	wait 0.
}
set th to 0.
unlock throttle.
unlock steering.
clearvecdraws().
HUDTEXT("Circularization complete", 4, 2, 30, yellow, false).