set oncetwice to 0.
print "running rendmain.ks".

until oncetwice = 2 {
set aop1 to ship:orbit:argumentofperiapsis.
set aop2 to TargetThingy:orbit:argumentofperiapsis.
set ta1  to aop2 -aop1.

ETAToTa(ship, ta1).
set TimeTargetPeriapsis to ta.

set SMA to ship:orbit:semimajoraxis.
set Ecc to ship:orbit:eccentricity.
set CurRadiusAtTargetPeriapsis to (SMA * ( (1-ecc^2) / (1+ecc*cos(ta1))))-body:radius.

DeltaVCalc(CurRadiusAtTargetPeriapsis, ((TargetThingy:orbit:apoapsis+ CurRadiusAtTargetPeriapsis + 2*body:radius)/2)).
EndDeltaV(DvNeeded).
TimeTillManeuverBurn(TimeTargetPeriapsis, DvNeeded).

warpto(StartT-40).
wait until time:seconds > StartT-40.

if neg = true {
  SteeringOrbitRet().
} else {
  SteeringOrbitPro().
}

wait until time:seconds >= StartT.

PerformBurn(EndDv).

set oncetwice to oncetwice + 1.
}
//run rendprec.
run finmain.
// line 133
