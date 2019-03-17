@lazyglobal off.

{

global T_Other is lexicon(
  "ish", ish@,
  "VisViva", VisViva@,
  "CurrentDvCalc", CurrentDvCalc@,
  "DistanceAtTime", DistanceAtTime@,
  "ClosestApproachGetter", ClosestApproachGetter@,
  "ClosestApproachRefiner", ClosestApproachRefiner@,
  "RemoveAllNodes", RemoveAllNodes@,
  "NodeFromVector", NodeFromVector@,
  "WarpSetter", WarpSetter@,
  "WarpDecreaser", WarpDecreaser@
  ).

Function ish {
  Parameter a.
  Parameter b.
  Parameter ishyness.
  return a - ishyness < b and a + ishyness > b.
}

Function VisViva {
  Parameter StartAlt.
  // At which altitude do you want to start the burn
  Parameter TargetSMA.
  // What's the SMA at the end?

  local GM is body:mu.
  local StartAlt is StartAlt + body:radius.
  // StartAlt parameter does NOT include the body's radius (so it's added here)
  local VeloStart is SQRT(GM * ((2/StartAlt) - (1/ship:orbit:semimajoraxis)) ).
  local VeloEnd is SQRT(GM * ((2/StartAlt) - (1/TargetSMA)) ).
  local DvNeeded is VeloEnd-VeloStart.

  return DvNeeded.
}

Function CurrentDvCalc {

  local eIsp is 0.
  local MyEngs is list().
  list engines in MyEngs.
  for Eng in MyEngs {
    local EngMaxThrust is max(0.001, eng:maxthrust).
    set eIsp to eISP + ((EngMaxThrust/maxthrust)*eng:isp).
  }
  local Ve is eIsp * 9.80665.
  local CurDv is Ve * ln(ship:mass / ship:drymass).

  return CurDv.
}

/////////////////////////////////
/////////////////////////////////
/////////////////////////////////

local MostFavourableOption is "x".

Function DistanceAtTime {
  Parameter T.
  Parameter TargetDestination.

  return ((positionat(ship, T) - positionat(TargetDestination, T)):mag).
}

Function ClosestApproachGetter {

  Parameter PeriodPrecision.
  Parameter T.
  Parameter SurpassThis.
  Parameter TargetDestination.

  set MostFavourableOption to T.
  print round(SurpassThis) at(1,13).

  local Candidates is list().
  local StandardStepSize is "x".
  local ScoringNode is nextnode.

  if ScoringNode:orbit:hasnextpatch = true {
    set StandardStepSize to ScoringNode:orbit:nextpatch:period * PeriodPrecision.
    //print "StanStep  " +StandardStepSize at (1,7).
  } else {
    set StandardStepSize to ScoringNode:orbit:period * PeriodPrecision.
    //print "StanStep  " +StandardStepSize at (1,7).
  }

  local StepSize is StandardStepSize.
  local EndFunction is 0.

  //                  10
  until EndFunction = 50 {
    Candidates:add(list(T + StepSize, TargetDestination)).
    set StepSize to StepSize + StandardStepSize.
    set EndFunction to EndFunction + 1.
    }

  set StepSize to StandardStepSize.
  set EndFunction to 0.

  //                  10
  until EndFunction = 50 {
    Candidates:add(list(T - StepSize, TargetDestination)).
    set StepSize to StepSize + StandardStepSize.
    set EndFunction to EndFunction + 1.
    }

    for Candidate in Candidates {
      local CandidateScore is DistanceAtTime(Candidate[0], Candidate[1]).
      print round(CandidateScore) at (1,10).
      print round(SurpassThis) at (1,11).
      if CandidateScore < SurpassThis {
        set SurpassThis to CandidateScore.
        set MostFavourableOption to Candidate[0].
        local ClosestApproach is DistanceAtTime(Candidate[0], Candidate[1]).
        return ClosestApproach.
      }
    }
}

Function ClosestApproachRefiner {
  Parameter TargetDestination.
  Parameter PrecisionNumber is 0.01. // 0.05

  local ScoringNode is nextnode.
  local T is "x".

  if ScoringNode:orbit:hasnextpatch = true {
    set T to time:seconds + 0.5 * ScoringNode:orbit:nextpatch:period.
  } else {
    set T to time:seconds + 0.5 * ScoringNode:orbit:period.
  }

  local SurpassThis is DistanceAtTime(T, TargetDestination).

  local ClosestApproach is ClosestApproachGetter(PrecisionNumber, T, SurpassThis, TargetDestination).
  //print ClosestApproach.

  local multiplier is 0.05.

  if ScoringNode:orbit:hasnextpatch = true {
  //  until multiplier*ScoringNode:orbit:nextpatch:period < 1 {
      //set multiplier to multiplier/10.
      set ClosestApproach to ClosestApproachGetter(multiplier, MostFavourableOption, ClosestApproach, TargetDestination).
  //  }
  } else {
  //  until multiplier*ScoringNode:orbit:period < 1 {
    //  set multiplier to multiplier/10.
      set ClosestApproach to ClosestApproachGetter(multiplier, MostFavourableOption, ClosestApproach, TargetDestination).
  //  }
  }


  //clearscreen.
  print "m:     " + round(ClosestApproach) + "                      " at(1,10).
  print "km:    " + round(ClosestApproach/1000) + "                 " at(1,11).
  print "Mm:    " + round(ClosestApproach/1000000) + "              " at(1,12).
  print "Gm:    " + round(ClosestApproach/1000000000) + "           " at(1,13).
  T_ReadOut["ClosestApproachGUI"](ClosestApproach).
  return ClosestApproach.
}

///////////////////
///////////////////
///////////////////

Function RemoveAllNodes {
  until hasnode = false {
    remove nextnode.
    wait 1.
  }
}

Function NodeFromVector {
  Parameter StartVector.
  Parameter TimeTillNode is time:seconds.

  local ShipPrograde is velocityat(ship, TimeTillNode):orbit.
  local ShipPosition is positionat(ship, TimeTillNode) - body:position.
  local ShipNormal   is vcrs(ShipPrograde, ShipPosition).
  local ShipRadial   is vcrs(ShipNormal, ShipPrograde).

  local ProgradeComponent is vdot(StartVector, ShipPrograde:normalized).
  local NormalComponent   is vdot(StartVector, ShipNormal:normalized).
  local RadialComponent   is vdot(StartVector, ShipRadial:normalized).

  return list(TimeTillNode, RadialComponent, NormalComponent, ProgradeComponent).
}

///
///
///

Function WarpSetter {
  Parameter NumberOfChecks.
  Parameter WarpOverride is 0.

  local WarpSpeed is round(ship:orbit:period/NumberOfChecks).

  if WarpSpeed > 1000 {
    if WarpSpeed < 8000 {
      set WarpSpeed to 1000.
    }

    if WarpSpeed < 90000 {
      set WarpSpeed to 10000.
    }
  } else {
    if WarpSpeed > 300 {
      set WarpSpeed to 1000.
    }
  }

  if WarpOverride > 0 {
    set WarpSpeed to WarpOverride.
  }
  
  print "WarpSpeed: " + WarpSpeed.
  set kuniverse:timewarp:rate to WarpSpeed.
}

Function WarpDecreaser {
  set kuniverse:timewarp:warp to 0.
  until kuniverse:timewarp:rate = 1 {
    wait 1.
  }
}

}
print "read lib_other".
