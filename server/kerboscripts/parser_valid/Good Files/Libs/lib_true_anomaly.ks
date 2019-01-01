FUNCTION TaAtTime {
  Parameter TimeTill.
  Parameter TarShip.

  set SMA to TarShip:orbit:semimajoraxis.
  set Radius to (positionat(TarShip, TimeTill+time:seconds) - ship:body:position):mag .
  set PosVec to positionat(TarShip, TimeTill+time:seconds) - ship:body:position .
  set VelVec to velocityat(TarShip, TimeTill+time:seconds):orbit.
  set NegCheck to vdot(VelVec, PosVec).
  set Ecc to TarShip:orbit:Eccentricity.
  set TAx to ARCcos((((SMA*(1-Ecc^2))/Radius)-1)/Ecc).

  if NegCheck < 0 {
    set TAx to 360 - TAx.
  }

}

///
///
///

FUNCTION ETAToTa {
  Parameter TarShip.
  Parameter TADeg.
  Parameter TimeTill is 0.

  TaAtTime(TimeTill, TarShip).

  set TargetTime to TimePeToTa(TarShip, TADeg).
  set CurTime to TimePeToTa(TarShip, TAx).

  set TA to TargetTime - CurTime.

  if TA < 0 {
    set TA to TA + TarShip:orbit:period.
  }
}

///
///
///

FUNCTION TimePeToTa {
  Parameter TarShip.
  Parameter TADeg.

  set Ecc to TarShip:orbit:Eccentricity.
  set SMA to TarShip:orbit:semimajoraxis.
  set EccAnomDeg to ARCtan2(SQRT(1-Ecc^2)*sin(TADeg), Ecc + cos(TADeg)).
  set EccAnomRad to EccAnomDeg * (constant:pi/180).
  set MeanAnomRad to EccAnomRad - Ecc*sin(EccAnomDeg).
  return MeanAnomRad / SQRT(TarShip:orbit:body:mu / SMA^3).
}
