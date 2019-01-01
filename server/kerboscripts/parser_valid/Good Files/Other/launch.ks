DELETEPATH(copyfiles).
COPYPATH("0:/copyfiles", "").
RUN copyfiles.
RUN function.
RUN stagechecker.
stagecheck().
PARAMETER targget.
PARAMETER YN. // Y = LAND N = DONT LAND
PARAMETER ORB. // Y=NO TARGET BUT ORBIT N= TARGET IS TRUE

ffvsfguf

IF Alt:Radar < 100 {

	SET ASCENT_PROFILE TO LIST(
	0,		80,		1,
	2500,	80,		0.75,
	10000,	75,		0.75,
	15000,	70,		0.75,
	20000,	65,		0.75,
	25000,	60,		0.75,
	32000,	50,		0.75,
	45000,	35,		0.55,
	50000,	25,		0.35,
	60000,	10,		0.10,
	70000,	0,		0.05
	).

until ship:availablethrust > 0 {
  wait 0.5.
  stage.
}.

Lock throttle TO 1.

EXECUTE_ASCENT_PROFILE(90, ASCENT_PROFILE).
}

wait until alt:radar > 70000.
toggle ag1.
LOCK throttle to 0.

IF YN = N {
	If (APOAPSIS-PERIAPSIS)>5000{
	Run orbitpopper(90, 1, targget).
	}

	IF ORB = N{
		IF targget:mass > (10^10){
			bodyscript(targget).
			} ELSE {
			rendezvousscript(targget).
			}
	}

	IF ORB = Y{
	RUN newdv(targget).
	}
}

IF YN = Y {
deorbit().

landingatmo().
}
