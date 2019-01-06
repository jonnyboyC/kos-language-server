// Preset
// CopyFiles
// RCSThrottle

// SteeringOrbitRet
// SteeringOrbitPro
// SteeringOrbitNorm
// SteeringOrbitAntNorm
// SteeringTargetPro
// SteeringTargetRet
// SteeringTarget
// SteeringAntiTarget

// DeltaVCalc
// EndDeltaV
// TimeTillManeuverBurn
// PerformBurn

// TaAtTime
// ETAToTa
// TimePeToTa

// RelativeAngle
// AscenDescenFinder

FUNCTION Preset {
  Parameter TarShip is ship.

  RelativeAngle(TarShip).

  sas on.
  wait 0.5.
  set navmode to "ORBIT".
  wait 0.5.
  sas off.
  rcs off.

  Unlock steering.
  Lock throttle to 0.
  Set SHIP:CONTROL:PILOTMAINTHROTTLE to 0.

  List engines IN my_engines.
  For eng In my_engines{
    set eng:ThrustLimit to 100.
  }

  RCSThrottle(100).

  set oncetwice to 0.
  clearscreen.

}

///
///
///

FUNCTION CopyFiles {
  Parameter NeededDirec.
  Parameter NeededList.

  set NeededDirec to path("0:/"+NeededDirec).


  For File in NeededList {
    deletepath(File).
    set filex to path(NeededDirec+"/"+File).
    copypath(filex, "").
  }
}

///
///
///
FUNCTION RCSThrottle {
  Parameter ThrottleVar.

  set RCSList to ship:partsnamed("RCSBlock").
  for RCSUnit in RCSList{
    RCSUnit:getmodule("moduleRCSFX"):setfield("thrust limiter", ThrottleVar).
  }

}
///
///
///
FUNCTION SteeringOrbitRet {
  lock steering to -velocity:orbit.
  set vangdone to false.
  until vangdone = true {
    if vang(ship:facing:vector, -velocity:orbit) < 2 {
      wait 5.
      if vang(ship:facing:vector, -velocity:orbit) < 2 {
        set vangdone to true.
      }
    }
  }
  set vangdone to false.
}

///
///
///

FUNCTION SteeringOrbitPro {
  lock steering to velocity:orbit.
  set vangdone to false.
  until vangdone = true {
    if vang(ship:facing:vector, velocity:orbit) < 2 {
      wait 5.
      if vang(ship:facing:vector, velocity:orbit) < 2 {
        set vangdone to true.
      }
    }
  }
  set vangdone to false.
}

///
///
///

FUNCTION SteeringOrbitNorm {

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

FUNCTION SteeringOrbitAntNorm {

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

FUNCTION SteeringTargetPro {
  Parameter TarShip.

  lock steering to ship:velocity:orbit - TarShip:velocity:orbit.
  set vangdone to false.
  until vangdone = true {
    if vang(ship:facing:vector, ship:velocity:orbit - TarShip:velocity:orbit) < 2 {
      wait 5.
      if vang(ship:facing:vector, ship:velocity:orbit - TarShip:velocity:orbit) < 2 {
        set vangdone to true.
      }
    }
  }
  set vangdone to false.
}

///
///
///

FUNCTION SteeringTargetRet {
  Parameter TarShip.
  print TarShip.

  lock steering to -(ship:velocity:orbit - TarShip:velocity:orbit).
  set vangdone to false.
  until vangdone = true {
    if vang(ship:facing:vector, -(ship:velocity:orbit - TarShip:velocity:orbit)) < 2 {
      wait 5.
      if vang(ship:facing:vector, -(ship:velocity:orbit - TarShip:velocity:orbit)) < 2 {
        set vangdone to true.
      }
    }
  }
  set vangdone to false.
}

///
///
///

FUNCTION SteeringTarget {
  Parameter TarShip.

  lock steering to -(ship:position - TarShip:position).
  set vangdone to false.
  until vangdone = true {
    if vang(ship:facing:vector, -(ship:position - TarShip:position)) < 2 {
      wait 5.
      if vang(ship:facing:vector, -(ship:position - TarShip:position)) < 2 {
        set vangdone to true.
      }
    }
  }
  set vangdone to false.
}

///
///
///

FUNCTION SteeringAntiTarget {
  Parameter TarShip.

  lock steering to ship:position - TarShip:position.
  set vangdone to false.
  until vangdone = true {
    if vang(ship:facing:vector, ship:position - TarShip:position) < 2 {
      wait 5.
      if vang(ship:facing:vector, ship:position - TarShip:position) < 2 {
        set vangdone to true.
      }
    }
  }
  set vangdone to false.
}

///
///
///

FUNCTION DeltaVCalc {

  Parameter StartRadius.
  Parameter EndSMA.

  set GM to body:mu.
  set CurAlt to body:radius + StartRadius.
  set Vsquared to (GM*((2/CurAlt)-(1/ship:orbit:semimajoraxis))).
  set Velo to SQRT(Vsquared).
  print Velo.

  set ModSMA to EndSMA.
  set V1squared to (GM*((2/Curalt)-(1/ModSMA))).
  set Velo1 to SQRT(V1squared).
  print Velo1.

  set DvNeeded to Velo1-Velo.
  print "-0-0-0-0-".
  print "dv needed " + DvNeeded.
  if DvNeeded < 0 {
    set Neg to true.
  } else {
    set Neg to false.
  }
  set DvNeeded to ABS(DvNeeded).

}

///
///
///

FUNCTION EndDeltaV {

  Parameter DvNeeded.

  SET eIsp TO 0.
  List engines IN my_engines.
  For eng In my_engines{
    SET eIsp TO eISP + ((eng:maxthrust/maxthrust)*eng:isp).
  }
  SET Ve TO eIsp*9.80665.

  set CurDv to Ve * ln(ship:mass / ship:drymass).
  set EndDv to CurDv - DvNeeded.
  print "Current Dv: " + CurDv.
  print "Final Dv:   " + EndDv.

}

///
///
///

FUNCTION TimeTillManeuverBurn {

  Parameter StartTime.
  Parameter DvNeeded.
  Parameter ThrustLimit is 100.

  SET A0 TO (Maxthrust/mass).
  SET eIsp TO 0.
  List engines IN my_engines.
  For eng In my_engines{
    SET eIsp TO eISP + ((eng:maxthrust/maxthrust)*eng:isp).
  }
  SET Ve TO eIsp*9.80665.
  SET FinalMass TO (mass*constant():e^(-1*DvNeeded/Ve)).
  SET A1 TO (Maxthrust/FinalMass).
  SET T TO (DvNeeded/((A0+A1)/2)).
  SET T TO T * (100/ThrustLimit).

  set StartT to (time:seconds + StartTime - T/2).

}

///
///
///

FUNCTION PerformBurn {

  Parameter EndDv.
  Parameter ThrustLimit is 100.

  set StopBurn to false.

  until StopBurn = true {

    SET eIsp TO 0.
    List engines IN my_engines.
    For eng In my_engines{
      SET eIsp TO eISP + ((eng:maxthrust/maxthrust)*eng:isp).
      SET eng:ThrustLimit to ThrustLimit.
    }
    SET Ve TO eIsp*9.80665.

    set CurDv to Ve * ln(ship:mass / ship:drymass).

    set MaxAcc to ship:maxthrust/ship:mass.

    set DeltaVMag to (CurDv - EndDv).
    lock throttle to MIN(DeltaVMag/MaxAcc, 1).
    if DeltaVMag < 0 {
      lock throttle to 0.
    }

    if throttle < 0.00001 {
      set throttle to 0.
      set StopBurn to true.
    }

  }

  For eng In my_engines{
    SET eng:ThrustLimit to 100.
  }

  print "--".
  print CurDv.
  print EndDv.
  print DeltaVMag.
}

///
///
///

FUNCTION TaAtTime {
  Parameter TimeVar.
  Parameter TarShip.

  set SMA to TarShip:orbit:semimajoraxis.
  set Radius to (positionat(TarShip, TimeVar) - ship:body:position):mag .
  set PosVec to positionat(TarShip, TimeVar) - ship:body:position .
  set VelVec to velocityat(TarShip, TimeVar):orbit.
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
  Parameter TimeVar is time:seconds.

  TaAtTime(TimeVar, TarShip).

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

///
///
///

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

///
///
///

FUNCTION Circularizer {
  Parameter TargetEccentricity.
  Parameter ApoPer is apoapsis.

  until ship:orbit:eccentricity < TargetEccentricity {

    if ApoPer = apoapsis {
      set ApoPer to ship:orbit:apoapsis.
      set EtaApPe to eta:apoapsis.
    } else {
      set ApoPer to ship:orbit:periapsis.
      set EtaApPe to eta:periapsis.
    }

    DeltaVCalc(ApoPer, ApoPer + body:radius).
    EndDeltaV(DvNeeded).
    TimeTillManeuverBurn(EtaApPe, EndDv).
    warpto(StartT - 40).
    if Neg = True {
      SteeringOrbitRet().
      } else {
      SteeringOrbitPro().
      }
    wait until time:seconds > StartT.
    PerformBurn(EndDv).
  }
}

///
///
///

FUNCTION InclinationMatcher {

  Parameter TarShip.

  AscenDescenFinder(TarShip).

  ETAToTa(ship, TrueAnomAN).
  set TimeAN to ta.
  ETAToTa(ship, TrueAnomDN).
  set TimeDN to ta.

  RelativeAngle(TarShip).

  DeltaVTheta(TrueAnomAN, ThetaChange).
  set ANDv to dvincl.

  DeltaVTheta(TrueAnomDN, ThetaChange).
  set DNDv to dvincl.

  set DvNeeded to min(ANDv, DNDv).

  if ANDv < DNDv {
    set TimeNeeded to TimeAN.
    set ANDN to 10.
  } else {
    set TimeNeeded to TimeDN.
    set ANDN to 20.
  }

  EndDeltaV(DvNeeded).
  TimeTillManeuverBurn(TimeNeeded, DvNeeded).

  if ANDN = 20 {
    SteeringOrbitAntNorm().
  }

  if ANDN = 10 {
    SteeringOrbitNorm().
  }

  warpto(StartT-40).
  wait until time:seconds > StartT.

  PerformBurn(EndDv).
  RelativeAngle(TarShip).
}

///
///
///

FUNCTION KillRelVel {
  Parameter Tarship.
  Parameter ThrustLimit is 100.

  lock RelVelMag to (ship:velocity:orbit - Tarship:velocity:orbit):mag.

  SteeringTargetRet(Tarship).
  EndDeltaV(RelVelMag).
  PerformBurn(EndDv, ThrustLimit).
}

///
///
///

FUNCTION Approach {
  Parameter ApproachSpeed.
  Parameter TarShip.
  Parameter ThrustLimit is 100.
  Parameter StopDistance is 1500.

  SteeringTarget(TarShip).

  EndDeltaV(ApproachSpeed).
  PerformBurn(EndDv).

  set doneyet to false.

  until doneyet = true {

    set olddis to TargetThingy:distance.
    wait 5.
    set newdis to TargetThingy:distance.
    print ROUND(newdis).

    if olddis < newdis {
      set doneyet to true.
    }

    if TarShip:distance < StopDistance {
      set doneyet to true.
    }
  }
  set kuniverse:timewarp:warp to 0.
  KillRelVel(TarShip, ThrustLimit).
}

FUNCTION FinalApproach {
  Parameter StopDistance is 500.


  Until TargetThingy:distance < StopDistance {
  print "running loop".

  if TargetThingy:distance > 25000 {
    Approach(50, TargetThingy, 100, 5000).
    print "25000".
  }

  else if TargetThingy:distance > 15000 {
    Approach(30, TargetThingy, 100, 3000).
    print "15000".
  }


  else if TargetThingy:distance > 10000 {
    Approach(20, TargetThingy, 100, 2000).
    print "10000".
  }


  else if TargetThingy:distance > 7500 {
    Approach(15, TargetThingy, 100, 1500).
    print "7500".
  }


  else if TargetThingy:distance > 5000 {
    Approach(10, TargetThingy, 100, 1000).
    print "5000".
  }


  else if TargetThingy:distance > 3000 {
    Approach(10, TargetThingy, 100, 1000).
    print "3000".
  }


  else if TargetThingy:distance > 2000 {
    Approach(4, TargetThingy, 100, StopDistance).
    print "2000".
  }


  else if TargetThingy:distance > 1500 {
    Approach(3, TargetThingy, 100, StopDistance).
    print "2000".
  }


  else if TargetThingy:distance > 1000 {
    Approach(2, TargetThingy, 100, StopDistance).
    print "1000".
  }


  else if TargetThingy:distance > 501 {
    Approach(1, TargetThingy, 100, StopDistance).
    print "500".
  }


  }

}

///
///
///

FUNCTION ThreeQuarterTargetOrbit {
  Parameter TarShip.

  set TargetSMA to ((TarShip:periapsis *0.75) + ship:periapsis +2*body:radius)/2.

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

  set TargetSMA to ((TarShip:periapsis *0.75) + ship:apoapsis +2*body:radius)/2.

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

///
///
///

function translate {

  parameter vector.
  if vector:mag>1 {
    set vector to vector:normalized.
  }

  set ship:control:fore       to vector * ship:facing:forevector.
  set ship:control:starboard  to vector * ship:facing:starvector.
  set ship:control:top        to vector * ship:facing:topvector.

}

FUNCTION kill_rel_vel {
  parameter targetport.

  lock relvel to ship:velocity:orbit - targetport:ship:velocity:orbit.

  until relvel:mag < 0.1 {
    translate(-1*relvel).
  }
  translate(v(0,0,0)).
}

FUNCTION approach_port {
  parameter targetport, dockingport, distance, speed.

  dockingport:controlfrom.

  lock distanceoffset to targetport:portfacing:vector * distance.
  lock approachvector to targetport:nodeposition - dockingport:nodeposition + distanceoffset.
  lock relvel to ship:velocity:orbit - targetport:ship:velocity:orbit.
  lock steering to LOOKDIRUP(-targetport:portfacing:vector, targetport:portfacing:upvector).

  until dockingport:state <> "ready" {
    translate((approachvector:normalized*speed) - relvel).
    local distancevector is (targetport:nodeposition - dockingport:nodeposition).
    if vang(dockingport:portfacing:vector, distancevector) < 2 and ABS(distance - distancevector:mag) < 0.1 {
      break.
      }
    wait 0.02.
    }
    translate(v(0,0,0)).
  }
