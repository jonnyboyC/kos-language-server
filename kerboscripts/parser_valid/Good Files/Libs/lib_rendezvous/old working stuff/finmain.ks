print "running finmain".
set newpe to -999.
set newap to -999.

if ship:orbit:period < TargetThingy:orbit:period {
  until NewPe > 5000 {

    ETAToTa(TargetThingy, 180, time:seconds+eta:apoapsis).
    set TimeAp to ta.

    print "time till target ap: " + TimeAp.

    // TimeAp > current orb period - increase orbit till matches
    // current orb period > TimeAp - decrease orbit till matches

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
}

if ship:orbit:period > TargetThingy:orbit:period {
  until NewAp > 5000 {

    ETAToTa(TargetThingy, 180, time:seconds+eta:periapsis).
    set TimePe to ta.
    set TimePe to TimePe + TargetThingy:orbit:period.

    print "time till target pe: " + TimePe.

    // TimeAp > current orb period - increase orbit till matches
    // current orb period > TimeAp - decrease orbit till matches

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
}

run inclsub.
// line 192
