@lazyglobal off.

{

global T_ClosestApp is lexicon(
  "ClosestApproachFinder", ClosestApproachFinder@,
  "OtherClosestApproachFinder", OtherClosestApproachFinder@
  ).

Function DistanceAtTime {
  Parameter T.
  Parameter TargetDestination.

  return (positionat(ship, T) - positionat(TargetDestination, T)):mag.
}

// Closest Approach Ternary Search
Function CATS {
  Parameter TargetBody.
  Parameter Left.
  Parameter Right.
  Parameter AbsolutePrecision.

  until false {
    if abs(Right - Left) < AbsolutePrecision {
      return (Left + Right)/2.
    }

    local LeftThird  is Left  + (Right - Left)/3.
    local RightThird is Right - (Right - Left)/3.

    if DistanceAtTime(LeftThird, TargetBody) > DistanceAtTime(RightThird, TargetBody) {
      set Left  to LeftThird.
    } else {
      set Right to RightThird.
    }
  }
}

Function ClosestApproachFinder {

  Parameter TargetBody.

  local ErrorMode is false.
  local StartTime is 0.
  local EndTime   is 0.
  local TimeTillClosestApp is 0.
  local ClosestApproach is 0.

  if nextnode:orbit:hasnextpatch = true {
    if nextnode:orbit:nextpatch:body = TargetBody:body {
      set StartTime to time:seconds + eta:transition + 120.
      if nextnode:orbit:nextpatch:eccentricity < 1 {
        set EndTime to time:seconds + eta:transition + nextnode:orbit:nextpatch:period.
      } else {
        set ErrorMode to true.
      }
    } else {
      print "major error".
      set ErrorMode to true.
    }
  } else if nextnode:orbit:body = TargetBody:body {
    set StartTime to time:seconds + 120.
    set EndTime   to time:seconds + ship:orbit:period.
  } else {
    print "major error".
    set ErrorMode to true.
  }

  print "cur m: " + round(DistanceAtTime(time:seconds, TargetBody)) at (1,9).

  if ErrorMode = false {
    set TimeTillClosestApp to CATS(TargetBody, StartTime, EndTime, 10).
    set ClosestApproach    to DistanceAtTime(TimeTillClosestApp, TargetBody).
  } else {
    set ClosestApproach to 999999999999999.
  }

  print "m:     " + round(ClosestApproach) + "                      " at(1,10).
  print "km:    " + round(ClosestApproach/1000) + "                 " at(1,11).
  print "Mm:    " + round(ClosestApproach/1000000) + "              " at(1,12).
  print "Gm:    " + round(ClosestApproach/1000000000) + "           " at(1,13).
  T_ReadOut["ClosestApproachGUI"](ClosestApproach).
  return ClosestApproach.

}

Function OtherClosestApproachFinder {

  Parameter TargetBody.

  local ErrorMode is false.
  local StartTime is 0.
  local EndTime   is 0.
  local TimeTillClosestApp is 0.
  local ClosestApproach is 0.

  if nextnode:orbit:hasnextpatch = true {
    if nextnode:orbit:nextpatch:body = TargetBody:body {
      set StartTime to time:seconds + eta:transition + 120.
      set EndTime   to time:seconds + eta:transition + nextnode:orbit:nextpatch:period.
    } else {
      print "major error".
      set ErrorMode to true.
    }
  } else if nextnode:orbit:body = TargetBody:body {
    set StartTime to time:seconds + 120.
    set EndTime   to time:seconds + ship:orbit:period.
  } else {
    print "major error".
    set ErrorMode to true.
  }

  print "cur m: " + round(DistanceAtTime(time:seconds, TargetBody)) at (1,9).

  if ErrorMode = false {
    set TimeTillClosestApp to CATS(TargetBody, EndTime, StartTime, 10).
    set ClosestApproach    to DistanceAtTime(TimeTillClosestApp, TargetBody).
  } else {
    set ClosestApproach to 999999999999999.
  }

  print "m:     " + round(ClosestApproach) + "                      " at(1,10).
  print "km:    " + round(ClosestApproach/1000) + "                 " at(1,11).
  print "Mm:    " + round(ClosestApproach/1000000) + "              " at(1,12).
  print "Gm:    " + round(ClosestApproach/1000000000) + "           " at(1,13).
  T_ReadOut["ClosestApproachGUI"](ClosestApproach).
  return ClosestApproach.

}

///
/// NOTE THIS IS A LESS HEAVY VERSION OF THE CLOSEST APPROACH GETTER OVER AT LIB_OTHER
///
}

print "read lib_closest_approach".
