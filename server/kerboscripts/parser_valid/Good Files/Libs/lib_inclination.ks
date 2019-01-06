FUNCTION RelativeAngle {

  Parameter TarShip.

  set inclin1 to ship:orbit:inclination.
  set inclin2 to TarShip:orbit:inclination.

  set omega1  to ship:orbit:LAN.
  set omega2  to TarShip:orbit:LAN.

  set a1 to (sin(inclin1)*cos(omega1)).
  set a2 to (sin(inclin1)*sin(omega1)).
  set a3 to cos(inclin1).
  set xxc to v(a1, a2, a3).

  set b1 to (sin(inclin2)*cos(omega2)).
  set b2 to (sin(inclin2)*sin(omega2)).
  set b3 to cos(inclin2).
  set xcx to v(b1, b2, b3).

  set thetachange to ARCcos(vdot(xxc, xcx)).

}

///
///
///

FUNCTION AscenDescenFinder {

  parameter TarShip.

  set NormalVector1 to vcrs(ship:position - ship:body:position, ship:velocity:orbit).
  set NormalVector2 to vcrs(TarShip:position - TarShip:body:position, TarShip:velocity:orbit).

  // DNvector is the cross product of both normal vectors (both are on the same plane)
  set DNvector to vcrs(NormalVector2, NormalVector1).

  // TA of DN
  if vdot(DNvector + body:position, ship:velocity:orbit) > 0 {
    set TrueAnomDN to ship:orbit:trueanomaly + vang(DNvector, ship:position - ship:body:position).
  } else {
    set TrueAnomDN to ship:orbit:trueanomaly - vang(DNvector, ship:position - ship:body:position).
  }

  if TrueAnomDN < 0 {
    set TrueAnomDN to TrueAnomDN + 360.
  }

  // TA of AN
  set TrueAnomAN to TrueAnomDN + 180.
  if TrueAnomAN > 360 {
    set TrueAnomAN to TrueAnomAN -360.
  }

}

///
///
///

FUNCTION DeltaVTheta {
  parameter TrueAnomaly.
  parameter ThetaNeeded.

  set SMA    to ship:orbit:semimajoraxis.
  set rad1   to SMA*(1- ecc*cos(TrueAnomaly)).
  set velo   to SQRT(body:mu*((2/rad1)-(1/SMA))).
  set dvincl to (2*velo*sin(ThetaNeeded/2)).

}
