parameter TargetThingy.

copypath("0:/lib_rendezvous/rend_functions", "").
run rend_functions.

preset(TargetThingy).

set FileList to list("inclmain", "inclsub", "rendmain", "rendprec", "finmain", "finsub", "protodock").
CopyFiles("lib_rendezvous", FileList).

HUDTEXT("all go!", 5, 2, 50, yellow, false).

if ship:orbit:semimajoraxis < TargetThingy:orbit:semimajoraxis {
  set TargetSMA to ((TargetThingy:periapsis *0.75) + ship:periapsis +2*body:radius)/2.

  DeltaVCalc(ship:periapsis, TargetSMA).
  EndDeltaV(DvNeeded).
  TimeTillManeuverBurn(eta:periapsis, DvNeeded).

  warpto(StartT-40).
  wait until time:seconds > StartT-40.

  if Neg = True {
    SteeringOrbitRet().
  } else {
    SteeringOrbitPro().
  }

  wait until time:seconds > StartT.

  PerformBurn(EndDv).

  set TargetSMA to ((TargetThingy:periapsis *0.75) + ship:apoapsis +2*body:radius)/2.

  DeltaVCalc(ship:apoapsis, TargetSMA).
  EndDeltaV(DvNeeded).
  TimeTillManeuverBurn(eta:apoapsis, DvNeeded).

  warpto(StartT-40).
  wait until time:seconds > StartT-40.

  if Neg = True {
    SteeringOrbitRet().
  } else {
    SteeringOrbitPro().
  }

  wait until time:seconds > StartT.

  PerformBurn(EndDv).
}
run inclmain.
