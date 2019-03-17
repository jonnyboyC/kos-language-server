parameter TargetThingy.

set message to "1".
set c to TargetThingy:connection.
c:sendmessage(message).

copypath("0:/lib_rendezvous/rend_functions", "").
run rend_functions.

preset(TargetThingy).

HUDTEXT("all go!", 5, 2, 50, yellow, false).

// if chaser is in smaller orbit decrease to 3/4 of target orbit.
if ship:orbit:semimajoraxis < TargetThingy:orbit:semimajoraxis {
  ThreeQuarterTargetOrbit(TargetThingy).
}

// matching inclination
until thetachange < 0.009 {
  InclinationMatcher(TargetThingy).
}

// circularize
if ship:apoapsis < TargetThingy:periapsis {
  Circularizer(0.0009, apoapsis).
} else {
  Circularizer(0.0009, periapsis).
}

set oncetwice to 0.

// burn at the targets Pe position so the argument of periapsis-es are equal (run twice)
until oncetwice = 2 {
set aop1 to ship:orbit:argumentofperiapsis.
set aop2 to TargetThingy:orbit:argumentofperiapsis.
set ta1  to aop2 -aop1.

ETAToTa(ship, ta1).
set TimeTargetPeriapsis to ta.

set SMA to ship:orbit:semimajoraxis.
set Ecc to ship:orbit:eccentricity.
set CurRadiusAtTargetPeriapsis to (SMA * ( (1-ecc^2) / (1+ecc*cos(ta1))))-body:radius.

DeltaVCalc(CurRadiusAtTargetPeriapsis, ((TargetThingy:orbit:apoapsis+ CurRadiusAtTargetPeriapsis + 2*body:radius)/2)).
EndDeltaV(DvNeeded).
TimeTillManeuverBurn(TimeTargetPeriapsis, DvNeeded).

warpto(StartT-40).
wait until time:seconds > StartT-40.

if neg = true {
  SteeringOrbitRet().
} else {
  SteeringOrbitPro().
}

wait until time:seconds >= StartT.

PerformBurn(EndDv).

set oncetwice to oncetwice + 1.
}

set newpe to -999.
set newap to -999.

// Performs and calculates how high the new Ap/Pe needs to be for a rendezvous
if ship:orbit:period < TargetThingy:orbit:period {
  until NewPe > 5000 {

    ETAToTa(TargetThingy, 180, time:seconds+eta:apoapsis).
    set TimeAp to ta.

    print "time till target ap: " + TimeAp.

    set NewSMA to ((TimeAp^2 * body:mu)/(4*constant:pi^2))^(1/3).
    print NewSMA.

    set newpe to 2*NewSMA - 2*body:radius - ship:apoapsis.
    print "new pe:" + round(newpe).

    If body:atm:exists = true {
      if newpe < body:atm:HEIGHT {
        set newpe to -999.
      }
    }

    if newpe < 0 {
      HUDTEXT("WARNING: Periapsis too low!", 5, 2, 50, red, true).
      if eta:apoapsis < 3600 {
        set apwait to time:seconds+eta:apoapsis+30.
        warpto (apwait).
        wait until time:seconds > apwait.
        wait 2.
      }
      set apwait to time:seconds+eta:apoapsis-30.
      warpto (apwait).
      wait until time:seconds > apwait.
      wait 2.
    }
  }

  DeltaVCalc(ship:apoapsis, NewSMA).
  EndDeltaV(DvNeeded).
  TimeTillManeuverBurn(eta:apoapsis, DvNeeded, 33).

  WARPTO(StartT-40).
  wait until time:seconds >= StartT-40.

  if Neg = True {
    SteeringOrbitRet().
  } else {
    SteeringOrbitPro().
  }

  wait until time:seconds >= StartT.

  PerformBurn(EndDv, 33).
}

// same as above but chaser vessel is in a higher orbit
if ship:orbit:period > TargetThingy:orbit:period {
  until NewAp > 5000 {

    ETAToTa(TargetThingy, 180, time:seconds+eta:periapsis).
    set TimePe to ta.
    set TimePe to TimePe + TargetThingy:orbit:period.

    print "time till target pe: " + TimePe.

    set NewSMA to ((TimePe^2 * body:mu)/(4*constant:pi^2))^(1/3).
    print NewSMA.

    set newAp to 2*NewSMA - 2*body:radius - ship:periapsis.
    print "new ap:" + round(newap).

    If body:atm:exists = true {
      if newAp < body:atm:HEIGHT {
        set newAp to -999.
      }
    }

    if newAp < 0 {
      HUDTEXT("WARNING: Apoapsis too low!", 5, 2, 50, red, true).
      if eta:periapsis < 3600 {
        set pewait to time:seconds+eta:periapsis+30.
        warpto (pewait).
        wait until time:seconds > pewait.
        wait 2.
      }
      set pewait to time:seconds+eta:periapsis-30.
      warpto (pewait).
      wait until time:seconds > pewait.
      wait 2.
    }
  }

  DeltaVCalc(ship:periapsis, NewSMA).
  EndDeltaV(DvNeeded).
  TimeTillManeuverBurn(eta:periapsis, DvNeeded, 33).

  WARPTO(StartT-40).
  wait until time:seconds >= StartT-40.

  if Neg = True {
    SteeringOrbitRet().
  } else {
    SteeringOrbitPro().
  }

  wait until time:seconds >= StartT.

  PerformBurn(EndDv, 33).
}

// warp one orbit (which is also the rendezvous point)

set P to ship:orbit:period.

set warpwait to time:seconds + p - (1/5)*P.
warpto(warpwait).
wait until time:seconds > warpwait.

if eta:periapsis < eta:apoapsis {
  set newwait to time:seconds + eta:periapsis-1.
  wait 1.
  WARPTO(newwait).
  wait until time:seconds > newwait.
} else if eta:periapsis > eta:apoapsis {
  set newwait to time:seconds + eta:apoapsis-1.
  wait 1.
  WARPTO(newwait).
  wait until time:seconds > newwait.
}
// killing relative velocity and approaching target ship

KillRelVel(TargetThingy, 30).
FinalApproach(500).

rcs on.
sas off.

set dockingport to ship:partstagged("port A")[0].
set targetport  to TargetThingy:partstagged("port B")[0].

print "killing relative velocity...".
kill_rel_vel(targetPort).
print "approaching...".
approach_port(targetPort, dockingPort, 100, 5).
approach_port(targetPort, dockingPort, 50, 3).
approach_port(targetPort, dockingPort, 40, 1).
approach_port(targetPort, dockingPort, 35, 0.4).

// wait till target ship signals it is alligned
wait until not ship:messages:empty.
  set received to ship:messages:pop.
  if received:content = "Command 1" {
    wait 0.
  }

  print "received".

  wait 1.
  rcs on.
  wait 1.

// finish docking
approach_port(targetPort, dockingPort, 20, 2).
approach_port(targetPort, dockingPort, 10, 1).
approach_port(targetPort, dockingPort, 0, 0.5).

translate(v(0,0,0)).
rcs off.
sas on.
