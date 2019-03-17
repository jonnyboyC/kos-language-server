@lazyglobal off.

{

global T_TrueAnomaly is lexicon(
  "TrueAnomalyAtTime", TrueAnomalyAtTime@,
  "TimePeToTa", TimePeToTa@,
  "ETAToTrueAnomaly", ETAToTrueAnomaly@
  ).

Function TrueAnomalyAtTime {
  Parameter TimeTill.
  Parameter TargetObject.

  local SMA is TargetObject:orbit:semimajoraxis.
  local Radius is (positionat(TargetObject, TimeTill+time:seconds) - ship:body:position):mag .
  local PosVec is positionat(TargetObject, TimeTill+time:seconds) - ship:body:position .
  local VelVec is velocityat(TargetObject, TimeTill+time:seconds):orbit.
  local NegCheck is vdot(VelVec, PosVec).
  local Ecc is TargetObject:orbit:Eccentricity.
  if  Ecc = 0 {
    set Ecc to 10^(-1*10).
  }
  local CurrentTrueAnomaly is ARCcos((((SMA*(1-Ecc^2))/Radius)-1)/Ecc).

  if NegCheck < 0 {
    set CurrentTrueAnomaly to 360 - CurrentTrueAnomaly.
  }
  return CurrentTrueAnomaly.
}

Function TimePeToTa {
  Parameter TargetObject.
  Parameter TADeg.

  local Ecc is TargetObject:orbit:Eccentricity.
  local SMA is TargetObject:orbit:semimajoraxis.
  local EccAnomDeg is ARCtan2(SQRT(1-Ecc^2)*sin(TADeg), Ecc + cos(TADeg)).
  local EccAnomRad is EccAnomDeg * (constant:pi/180).
  local MeanAnomRad is EccAnomRad - Ecc*sin(EccAnomDeg).
  return MeanAnomRad / SQRT(TargetObject:orbit:body:mu / SMA^3).
}

FUNCTION ETAToTrueAnomaly {
  Parameter TargetObject.
  Parameter DesiredTrueAnomaly.
  Parameter TimeTill is 0.

  local CurrentTrueAnomaly is TrueAnomalyAtTime(TimeTill, TargetObject).

  local TargetTime  is TimePeToTa(TargetObject, DesiredTrueAnomaly).
  local CurrentTime is TimePeToTa(TargetObject, CurrentTrueAnomaly).

  local TimeTillDesiredTrueAnomaly is TargetTime - CurrentTime.

  if TimeTillDesiredTrueAnomaly < 0 {
    set TimeTillDesiredTrueAnomaly to TimeTillDesiredTrueAnomaly + TargetObject:orbit:period.
  }

  return TimeTillDesiredTrueAnomaly.
}
}
print "read lib_true_anomaly".
