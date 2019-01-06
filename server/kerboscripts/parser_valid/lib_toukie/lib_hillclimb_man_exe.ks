@lazyglobal off.

{

global T_ManeuverExecute is lexicon(
  "ExecuteManeuver", ExecuteManeuver@
  ).

Function TimeTillManeuverBurn {

  Parameter StartTime.
  Parameter TargetManeuver is nextnode.
  Parameter ThrustLimit is 100.

  local DvNeeded is TargetManeuver:deltav:mag.
  local LocalMaxThrust is max(0.001, maxthrust).

  local Accel0 is (LocalMaxThrust/mass).
  local eIsp is 0.
  local EngList is list().

  list engines in EngList.
  for eng in EngList{
    local EngMax is max(0.001, eng:maxthrust).
    set eIsp to eISP + ((EngMax/LocalMaxThrust)*eng:isp).
  }
  local Ve is eIsp*9.80665.
  local FinalMass is (mass*constant():e^(-1*DvNeeded/Ve)).
  local Accel1 is (LocalMaxThrust/FinalMass).
  local BurnTime is (DvNeeded/((Accel0 + Accel1)/2)).
  local BurnTime is BurnTime * (100/ThrustLimit).

  local ETAStartT is (StartTime - BurnTime/2).
  local StartT is (ETAStartT+time:seconds).
  return StartT.
}

Function PerformBurn {

  Parameter StartT.
  Parameter ThrustLimit is 100.

  local StopBurn is false.
  sas off.

  T_Steering["SteeringManeuver"]().

  if nextnode:deltav:mag < 0.02 {
    set StopBurn to true.
  }

  warpto(StartT-10).

  lock steering to nextnode:deltav.
  wait until vang(ship:facing:vector, nextnode:deltav) < 0.1.
  local ShipFacingVec is ship:facing:vector.
  local lock ManVec to nextnode:deltav:normalized.

  wait until time:seconds > StartT.

  local OldDeltaVList is list().
  local OldDeltaVCount is 0.
  local OldDeltaVAverage is 10^(-9).
  local NewDeltaVList is list().
  local NewDeltaVCount is 0.
  local NewDeltaVAverage is 0.

  until StopBurn = true {

    if OldDeltaVCount < 25 {
      set OldDeltaVCount to OldDeltaVCount + 1.
      set OldDeltaVAverage to 10^(-9).
      OldDeltaVList:add(nextnode:deltav:mag).
    } else {
      for DeltaVMag in OldDeltaVList {
        set OldDeltaVAverage to OldDeltaVAverage + DeltaVMag.
      }
      set OldDeltaVAverage to round((OldDeltaVAverage / OldDeltaVCount), 5).
      set OldDeltaVCount to 0.
    }
    wait 0.

    if NewDeltaVCount < 25 {
      set NewDeltaVCount to NewDeltaVCount + 1.
      set NewDeltaVAverage to 0.
      NewDeltaVList:add(nextnode:deltav:mag).
    } else {
      for DeltaVMag in NewDeltaVList {
        set NewDeltaVAverage to NewDeltaVAverage + DeltaVMag.
      }
      set NewDeltaVAverage to round((NewDeltaVAverage / NewDeltaVCount), 5).
      set NewDeltaVCount to 0.
    }
    wait 0.

    local LocalMaxThrust is max(0.001, maxthrust).
    local eIsp is 0.
    local EngList is list().

    list engines in EngList.
    for eng in EngList{
      local EngMax is max(10^(-9), eng:maxthrust).
      set eIsp to eISP + ((EngMax/LocalMaxThrust)*eng:isp).
    }
    local Ve is eIsp*9.80665.
    local CurDv   to Ve * ln(ship:mass / ship:drymass).
    local MaxAcc  to MaxThrust/ship:mass.
    local MaxAcc  to max(0.001, MaxAcc).

    lock throttle to min(nextnode:deltav:mag/MaxAcc, 1).

    if MaxThrust > 0 {
      local CurThrust is throttle * MaxThrust.
      if CurThrust < 0.1 {
        lock throttle to 0.
        HUDtext("Throttle near 0, ending burn.", 5, 2, 30, green, false).
        set StopBurn to true.
      }
    }

    if nextnode:deltav:mag < 0.01 {
        lock throttle to 0.
        HUDtext("Dv left very small, ending burn.", 5, 2, 30, green, false).
        wait 3.
        set StopBurn to true.
      }

    if vdot(ShipFacingVec, ManVec) < 0 {
      lock throttle to 0.
      HUDtext("Dv marker to far from starting position.", 5, 2, 30, green, false).
      wait 3.
      set StopBurn to true.    }

    if OldDeltaVAverage < NewDeltaVAverage {
      lock throttle to 0.
      HUDtext("Detected increase of Dv (" + round(NewDeltaV, 3) + " Dv left), ending burn.", 5, 2, 30, green, false).
      HUDtext("OldDv: " + OldDeltaVAverage, 5, 2, 30, green, true).
      HUDtext("NewDv: " + NewDeltaVAverage, 5, 2, 30, green, true).
      wait 1.
      set StopBurn to true.
    }
  }
}

Function ExecuteManeuver {
  Parameter NodeWorthyList.

  local FinalManeuver is node(NodeWorthyList[0], NodeWorthyList[1], NodeWorthyList[2], NodeWorthyList[3]).
  add FinalManeuver.
  wait 1.

  if nextnode:deltav:mag > 0.1 {
    local TimeTill is TimeTillManeuverBurn(FinalManeuver:eta, FinalManeuver).
    PerformBurn(TimeTill).
    unlock steering.
  }
  remove nextnode.
}

}


print "read lib_hillclimb_man_exe".
