@lazyglobal off.

{

global T_Warp is lexicon(
  "WarpToPhaseAngle", WarpToPhaseAngle@,
  "WarpToEjectionAngle", WarpToEjectionAngle@
  ).

Function WarpToPhaseAngle {

  Parameter TargetPlanet.
  Parameter Ishyness.
  Parameter StartingBody is ship:body.
  Parameter ReferenceBody is sun.
  Parameter WarpOverride is 100000.

  local CurrentPhaseAngle is T_PhaseAngle["CurrentPhaseAngleFinder"](TargetPlanet, StartingBody, ReferenceBody).
  local TargetPhaseAngle  is T_PhaseAngle["PhaseAngleCalculation"](TargetPlanet, StartingBody, ReferenceBody).

  T_Other["WarpSetter"](30, WarpOverride).

  until T_Other["ish"](CurrentPhaseAngle, TargetPhaseAngle, ishyness) {
    set CurrentPhaseAngle to T_PhaseAngle["CurrentPhaseAngleFinder"](TargetPlanet, StartingBody, ReferenceBody).
    T_ReadOut["PhaseAngleGUI"](CurrentPhaseAngle, TargetPhaseAngle).
  }

  T_Other["WarpDecreaser"]().
  print CurrentPhaseAngle.
}


// if we are in a smaller orbit than our target we need to burn at x degrees from the
// prograde of the ship's planet, if we are in a bigger orbit than our target we need
// to burn at x degrees from the retrograde of the ship's planet.

Function WarpToEjectionAngle {

  Parameter TargetPlanet.
  Parameter Ishyness.
  Parameter StartingBody is ship:body.
  Parameter ReferenceBody is Sun.

  local ResultList is T_PhaseAngle["EjectionAngleVelocityCalculation"](TargetPlanet, ReferenceBody).
  local EjectionAng is ResultList[0].

  local CurrentEjectionAngle is 1000. // nonsense value for now
  local lock PosToNegAngle to vcrs(vcrs(ship:velocity:orbit, body:position),ship:body:orbit:velocity:orbit).
  local lock NegToPosAngle to vcrs(ship:body:orbit:velocity:orbit, vcrs(ship:velocity:orbit, body:position)).

  print "ejection angle needed: " + EjectionAng.

  T_Other["WarpSetter"](30).

  until T_Other["Ish"](CurrentEjectionAngle, EjectionAng, Ishyness){

  if TargetPlanet:orbit:semimajoraxis > StartingBody:orbit:semimajoraxis {
    if vang(-body:position, PosToNegAngle) < vang(-body:position, NegToPosAngle) {
      set CurrentEjectionAngle to 360 - vang(-body:position , body:orbit:velocity:orbit).
    } else {
      set CurrentEjectionAngle to vang(-body:position , body:orbit:velocity:orbit).
    }
    EjectionAngleGUI(CurrentEjectionAngle, EjectionAng, "pro").
    print "Angle from prograde:   " + CurrentEjectionAngle at (1,4).
  }

  if TargetPlanet:orbit:semimajoraxis < StartingBody:orbit:semimajoraxis {
    if vang(-body:position, NegToPosAngle) < vang(-body:position, PosToNegAngle) {
      set CurrentEjectionAngle to 360 - vang(-body:position , -body:orbit:velocity:orbit).
    } else {
      set CurrentEjectionAngle to vang(-body:position , -body:orbit:velocity:orbit).
    }
    EjectionAngleGUI(CurrentEjectionAngle, EjectionAng, "retro").
    print "Angle from retrograde: " + CurrentEjectionAngle at (1,4).
  }
 }

 T_Other["WarpDecreaser"]().
}
}
print "read lib_warp".
