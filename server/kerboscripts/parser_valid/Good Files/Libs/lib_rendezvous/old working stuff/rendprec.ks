// precision right here !
print "running rendprec.ks".

set neededtime to eta:periapsis +time:seconds -60.
warpto(neededtime). // add error time and burntime
wait until time:seconds >= neededtime.
wait 0.
// dv calcing


DeltaVCalc(ship:periapsis, ((TargetThingy:orbit:apoapsis+ ship:periapsis + 2*body:radius)/2)).
EndDeltaV(DvNeeded).
TimeTillManeuverBurn(eta:periapsis, DvNeeded).

WarpTo(StartT-40).
wait until time:seconds >= StartT-40.

if neg = true {
  SteeringOrbitRet().
} else {
  SteeringOrbitPro().
}

wait until time:seconds >= StartT.
PerformBurn(EndDv).

run finmain.

// line 110
