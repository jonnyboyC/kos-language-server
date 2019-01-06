Function SteeringOrbitRet {

  parameter TimeTill is 0.

  set lockedposition to -velocityat(ship, time:seconds+TimeTill):orbit.
  lock steering to lockedposition.
  set vangdone to false.
  until vangdone = true {
    if vang(ship:facing:vector, lockedposition) < 2 {
      wait 5.
      if vang(ship:facing:vector, lockedposition) < 2 {
        set vangdone to true.
      }
    }
  }
  set vangdone to false.
}

///
///
///

Function SteeringOrbitPro {

  parameter TimeTill is 0.

  set lockedposition to velocityat(ship, time:seconds+TimeTill):orbit.
  lock steering to lockedposition.
  set vangdone to false.
  until vangdone = true {
    if vang(ship:facing:vector, lockedposition) < 2 {
      wait 5.
      if vang(ship:facing:vector, lockedposition) < 2 {
        set vangdone to true.
      }
    }
  }
  set vangdone to false.
}

///
///
///

Function SteeringOrbitNorm {

  if ship:orbit:inclination < 180{
    lock TargNorm to vcrs(ship:position - ship:body:position, ship:velocity:orbit).
    lock steering to TargNorm.
  } else {
    lock TargNorm to -vcrs(ship:position - ship:body:position, ship:velocity:orbit).
    lock steering to TargNorm.
  }

  set vangdone to false.
  until vangdone = true {
    if vang(ship:facing:vector, TargNorm) < 2 {
      wait 5.
      if vang(ship:facing:vector, TargNorm) < 2 {
        set vangdone to true.
      }
    }
  }
  set vangdone to false.
}

///
///
///

Function SteeringOrbitAntNorm {

  if ship:orbit:inclination < 180{
    lock TargNorm to -vcrs(ship:position - ship:body:position, ship:velocity:orbit).
    lock steering to TargNorm.
  } else {
    lock TargNorm to vcrs(ship:position - ship:body:position, ship:velocity:orbit).
    lock steering to TargNorm.
  }

  set vangdone to false.
  until vangdone = true {
    if vang(ship:facing:vector, TargNorm) < 2 {
      wait 5.
      if vang(ship:facing:vector, TargNorm) < 2 {
        set vangdone to true.
      }
    }
  }
  set vangdone to false.
}

///
///
///

Function SteeringTargetPro {
  Parameter TarShip.
  Parameter TimeTill is 0.

  set lockedposition to velocityat(ship, time:seconds+TimeTill):orbit - velocityat(TarShip, time:seconds+TimeTill):orbit.
  lock steering to lockedposition.
  set vangdone to false.
  until vangdone = true {
    if vang(ship:facing:vector, lockedposition) < 2 {
      wait 5.
      if vang(ship:facing:vector, lockedposition) < 2 {
        set vangdone to true.
      }
    }
  }
  set vangdone to false.
}

///
///
///

Function SteeringTargetRet {
  Parameter TarShip.
  Parameter TimeTill is 0.

  set lockedposition to -(velocityat(ship, time:seconds+TimeTill):orbit - velocityat(TarShip, time:seconds+TimeTill):orbit).

  lock steering to lockedposition.
  set vangdone to false.
  until vangdone = true {
    if vang(ship:facing:vector, lockedposition) < 2 {
      wait 5.
      if vang(ship:facing:vector, lockedposition) < 2 {
        set vangdone to true.
      }
    }
  }
  set vangdone to false.
}

///
///
///

Function SteeringTarget {
  Parameter TarShip.
  Parameter TimeTill is 0.

  set lockedposition to -(positionat(ship, time:seconds+TimeTill) - positionat(TarShip, time:seconds+TimeTill)).
  lock steering to lockedposition.
  set vangdone to false.
  until vangdone = true {
    if vang(ship:facing:vector, lockedposition) < 2 {
      wait 5.
      if vang(ship:facing:vector, lockedposition) < 2 {
        set vangdone to true.
      }
    }
  }
  set vangdone to false.
}

///
///
///

Function SteeringAntiTarget {
  Parameter TarShip.
  Parameter TimeTill is 0.

  set lockedposition to positionat(ship, time:seconds+TimeTill) - positionat(TarShip, time:seconds+TimeTill).

  lock steering to lockedposition.
  set vangdone to false.
  until vangdone = true {
    if vang(ship:facing:vector, lockedposition) < 2 {
      wait 5.
      if vang(ship:facing:vector, lockedposition) < 2 {
        set vangdone to true.
      }
    }
  }
  set vangdone to false.
}
