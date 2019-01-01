@lazyglobal off.

{

global T_PhaseAngle is lexicon(
  "PhaseAngleCalculation", PhaseAngleCalculation@,
  "CurrentPhaseAngleFinder", CurrentPhaseAngleFinder@,
  "GetGrandparentBody", GetGrandparentBody@,
  "EjectionAngleVelocityCalculation", EjectionAngleVelocityCalculation@
  ).

Function PhaseAngleCalculation {
  Parameter TargetDestination.
  Parameter StartingPoint is ship:body.
  Parameter ReferenceBody is sun.

  local SMA1 is StartingPoint:orbit:semimajoraxis.
  local SMA2 is TargetDestination:orbit:semimajoraxis.
  local SMA3 is SMA1 + SMA2.

  local TransitTime is constant:pi*sqrt((SMA3^3)/(8*ReferenceBody:mu)).
  local TargetPhaseAngle is 180-sqrt(ReferenceBody:mu/SMA2)*(TransitTime/SMA2)*(180/constant:pi).

  until TargetPhaseAngle < 360 {
    set TargetPhaseAngle to TargetPhaseAngle - 360.
  }

  until TargetPhaseAngle > 0 {
    set TargetPhaseAngle to TargetPhaseAngle + 360.
  }

  return TargetPhaseAngle.
}

Function CurrentPhaseAngleFinder {

  Parameter TargetPlanet.
  Parameter StartingBody is ship:body.
  Parameter ReferenceBody is sun.

  local CurrentPhaseAngle is vang(TargetPlanet:position - ReferenceBody:position, StartingBody:position - ReferenceBody:position).
  local vcrsCurrentPhaseAngle is vcrs(TargetPlanet:position - ReferenceBody:position, StartingBody:position - ReferenceBody:position).
  if vdot(v(0,1,0), vcrsCurrentPhaseAngle) <= 0 {
    set CurrentPhaseAngle to 360 - CurrentPhaseAngle.
  }

  return CurrentPhaseAngle.
}

Function GetGrandparentBody {
  Parameter TargetObject is ship.

  local GrandparentBody is "x".
  if TargetObject:body:hasbody {
    set GrandparentBody to TargetObject:body:body.
  } else {
    set GrandparentBody to Sun.
  }
  return GrandparentBody.
}

Function EjectionAngleVelocityCalculation {

  parameter TargetDestination.
  parameter ReferenceBody is Sun.

  local ShipParentSMA is ship:body:orbit:semimajoraxis.
  local ShipSMA is ship:orbit:semimajoraxis.
  local TargetDesSMA is TargetDestination:orbit:semimajoraxis.

  local SOIExitVel  is sqrt(ReferenceBody:mu/ShipParentSMA) * (sqrt((2*TargetDesSMA)/(ShipParentSMA+TargetDesSMA))-1).
  local EjectionVel is sqrt(SOIExitVel^2 + (2*ship:body:mu)/(ship:orbit:periapsis+ship:body:radius)).

  local firstE is ((EjectionVel^2)/2) - (ship:body:mu/ShipSMA).
  local AngVel is ShipSMA*EjectionVel.
  local anotherE is sqrt(1+(2*firstE*angvel^2)/ship:body:mu^2).
  local EjectionAng is 180 - arccos(1/anotherE).

  local CurrentVel is SQRT(ship:body:mu * ((2/(ship:altitude+ship:body:radius)) - (1/ship:orbit:semimajoraxis)) ).
  local InsertionBurnDV is EjectionVel-CurrentVel.

  local ReturnList is list(EjectionAng, InsertionBurnDV).
  return ReturnList.
}
}

print "read lib_phaseangle".
