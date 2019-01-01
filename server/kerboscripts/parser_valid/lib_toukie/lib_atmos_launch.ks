@lazyglobal off.

// DEPENDENCIES
// lib_stage

{

global T_AtmosLaunch is lexicon(
	"MainLaunch", MainLaunch@
).

Function PitchProgramRate {
	parameter PitchData.
	local VSpeed1 to PitchData["VSpeed"].
	local T1 to PitchData["Time"].
	local VSpeed2 to verticalspeed.
	local T2 to time:seconds.
	local dt to max(0.0001,T2 - T1).
	local VAccel to max(0.001,(VSpeed2 - VSpeed2)/dt).
	local AltFinal is PitchData["AltFinal"].
	local AltDiff is AltFinal - altitude.

	local a to 0.5*VAccel.
	local b to verticalspeed.
	local c to -AltDiff.

	local TimeToAlt to ((-b) + sqrt(max(0,b^2 - 4*a*c)))/(2*a).
	local PitchDes to PitchData["Pitch"].
	local PitchFinal to PitchData["PitchFinal"].
	local PitchRate to max(0,(PitchFinal - PitchDes)/TimeToAlt).

	local PitchDes to min(PitchFinal,max(0,PitchDes + dt*PitchRate)).

	set PitchData["Pitch"] to PitchDes.
	set PitchData["Time"] to T2.
	set PitchData["VSpeed"] to VSpeed2.

	return PitchData.
}

Function InstAz {
	parameter	Inc. // target inclination

	// find orbital velocity for a circular orbit at the current altitude.
	local VOrb is max(ship:velocity:orbit:mag + 1,sqrt( body:mu / ( ship:altitude + body:radius))).

	// Use the current orbital velocity
	//local VOrb is ship:velocity:orbit:mag.

	// project desired orbit onto surface heading
	local AzOrb is arcsin ( max(-1,min(1,cos(Inc) / cos(ship:latitude)))).
	if (Inc < 0) {
		set AzOrb to 180 - AzOrb.
	}

	// create desired orbit velocity vector
	local VStar is heading(AzOrb, 0)*v(0, 0, VOrb).

	// find horizontal component of current orbital velocity vector
	local VShipH is ship:velocity:orbit - vdot(ship:velocity:orbit, up:vector:normalized)*up:vector:normalized.

	// calculate difference between desired orbital vector and current (this is the direction we go)
	local VCorr is VStar - VShipH.

	// project the velocity correction vector onto north and east directions
	local VelN is vdot(VCorr, ship:north:vector).
	local VelE is vdot(VCorr, heading(90,0):vector).

	// calculate Compass heading
	local AzCorr is arctan2(VelE, VelN).
	return AzCorr.
}

Function MainLaunch {

	// Main Inputs
	Parameter TargetOrbit is 250000. // The target altitude of our parking orbit.
	Parameter IncDes is 0. // Desired inclination

	set ship:control:pilotmainthrottle to 0.

	// Ignition
	local PitchAng to 0.
	local Compass to InstAz(IncDes).
	lock throttle to 1.
	lock steering to lookdirup(heading(Compass,90-PitchAng):vector,ship:facing:upvector).
	T_Stage["LaunchStage"]().

	// Basic Staging:
	T_Stage["StageCheck"]().

	// Pitch Program Parameters
	local PitchData is lexicon().
	PitchData:add("Time",time:seconds).
	PitchData:add("Pitch",0).
	PitchData:add("PitchFinal",85).
	PitchData:add("VSpeed",verticalspeed).
	PitchData:add("AltFinal",0.7*ship:body:atm:height).

	// Run Mode Variables
	local AscentStage is 1.
	local ThrottleStage is 1.

	until AscentStage = 2 AND altitude > ship:body:ATM:height {
		// Run Mode Logic

		if apoapsis > TargetOrbit AND ThrottleStage = 1 {
			lock throttle to 0.
			set ThrottleStage to 2.
			set AscentStage to 2.
		}

		set PitchData to PitchProgramRate(PitchData).
		set PitchAng to PitchData["Pitch"].
		set Compass to InstAz(IncDes).

		wait 0.
	}
}

}
