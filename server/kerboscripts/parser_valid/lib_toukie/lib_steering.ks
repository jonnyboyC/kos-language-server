@lazyglobal off.

{

global T_Steering is lexicon(
  "SteeringOrbitRet", SteeringOrbitRet@,
  "SteeringOrbitPro", SteeringOrbitPro@,
  "SteeringOrbitNorm", SteeringOrbitNorm@,
  "SteeringOrbitAntNorm", SteeringOrbitAntNorm@,
  "SteeringTargetPro", SteeringTargetPro@,
  "SteeringTargetRet", SteeringTargetRet@,
  "SteeringTarget", SteeringTarget@,
  "SteeringAntiTarget", SteeringAntiTarget@,
  "SteeringManeuver", SteeringManeuver@
  ).

Function SteeringOrbitRet {

  parameter TimeTill is 0.

  local lockedposition is -velocityat(ship, time:seconds+TimeTill):orbit.
  lock steering to lockedposition.
  local vangdone is false.
  until vangdone = true {
    if vang(ship:facing:vector, lockedposition) < 2 {
      wait 5.
      if vang(ship:facing:vector, lockedposition) < 2 {
        set vangdone to true.
      }
    }
  }
}

Function SteeringOrbitPro {

  parameter TimeTill is 0.

  local lockedposition is velocityat(ship, time:seconds+TimeTill):orbit.
  lock steering to lockedposition.
  local vangdone is false.
  until vangdone = true {
    if vang(ship:facing:vector, lockedposition) < 2 {
      wait 5.
      if vang(ship:facing:vector, lockedposition) < 2 {
        set vangdone to true.
      }
    }
  }
}

Function SteeringOrbitNorm {

  if ship:orbit:inclination < 180{
    lock TargNorm to vcrs(ship:position - ship:body:position, ship:velocity:orbit).
    lock steering to TargNorm.
  } else {
    lock TargNorm to -vcrs(ship:position - ship:body:position, ship:velocity:orbit).
    lock steering to TargNorm.
  }

  local vangdone is false.
  until vangdone = true {
    if vang(ship:facing:vector, TargNorm) < 2 {
      wait 5.
      if vang(ship:facing:vector, TargNorm) < 2 {
        set vangdone to true.
      }
    }
  }
}

Function SteeringOrbitAntNorm {

  if ship:orbit:inclination < 180{
    lock TargNorm to -vcrs(ship:position - ship:body:position, ship:velocity:orbit).
    lock steering to TargNorm.
  } else {
    lock TargNorm to vcrs(ship:position - ship:body:position, ship:velocity:orbit).
    lock steering to TargNorm.
  }

  local vangdone is false.
  until vangdone = true {
    if vang(ship:facing:vector, TargNorm) < 2 {
      wait 5.
      if vang(ship:facing:vector, TargNorm) < 2 {
        set vangdone to true.
      }
    }
  }
}

Function SteeringTargetPro {
  Parameter TarShip.
  Parameter TimeTill is 0.

  local lockedposition is velocityat(ship, time:seconds+TimeTill):orbit - velocityat(TarShip, time:seconds+TimeTill):orbit.
  lock steering to lockedposition.
  local vangdone is false.
  until vangdone = true {
    if vang(ship:facing:vector, lockedposition) < 2 {
      wait 5.
      if vang(ship:facing:vector, lockedposition) < 2 {
        set vangdone to true.
      }
    }
  }
}

Function SteeringTargetRet {
  Parameter TarShip.
  Parameter TimeTill is 0.

  local lockedposition is -(velocityat(ship, time:seconds+TimeTill):orbit - velocityat(TarShip, time:seconds+TimeTill):orbit).

  lock steering to lockedposition.
  local vangdone is false.
  until vangdone = true {
    if vang(ship:facing:vector, lockedposition) < 2 {
      wait 5.
      if vang(ship:facing:vector, lockedposition) < 2 {
        set vangdone to true.
      }
    }
  }
}

Function SteeringTarget {
  Parameter TarShip.
  Parameter TimeTill is 0.

  local lock lockedposition to -(positionat(ship, time:seconds+TimeTill) - positionat(TarShip, time:seconds+TimeTill)).
  // OR local lock (but NOT lock, this overrides local variables called lockedposition)
  lock steering to lockedposition.
  local vangdone is false.
  until vangdone = true {
    if vang(ship:facing:vector, lockedposition) < 2 {
      wait 5.
      if vang(ship:facing:vector, lockedposition) < 2 {
        set vangdone to true.
      }
    }
  }
}

Function SteeringAntiTarget {
  Parameter TarShip.
  Parameter TimeTill is 0.

  local lockedposition is positionat(ship, time:seconds+TimeTill) - positionat(TarShip, time:seconds+TimeTill).

  lock steering to lockedposition.
  local vangdone is false.
  until vangdone = true {
    if vang(ship:facing:vector, lockedposition) < 2 {
      wait 5.
      if vang(ship:facing:vector, lockedposition) < 2 {
        set vangdone to true.
      }
    }
  }
}

Function SteeringManeuver {

  parameter TargetManeuver is nextnode.

  local lock lockedposition to TargetManeuver:deltav.
  lock steering to lockedposition.
  local vangdone is false.
  until vangdone = true {
    if vang(ship:facing:vector, lockedposition) < 2 {
      wait 5.
      if vang(ship:facing:vector, lockedposition) < 2 {
        set vangdone to true.
      }
    }
  }
}

}

print "read lib_steering".
