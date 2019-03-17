@lazyglobal off.

{

global T_TransferBurn is lexicon(
  "InsertionBurn", InsertionBurn@,
  "ExitSOI", ExitSOI@,
  "CorrectionBurn", CorrectionBurn@,
  "FinalCorrectionBurn", FinalCorrectionBurn@,
  "MoonInsertionBurn", MoonInsertionBurn@,
  "MoonCorrectionBurn", MoonCorrectionBurn@,
  "MoonPostEncounterBurn", MoonPostEncounterBurn@,
  "InclinationMatcher2", InclinationMatcher2@,
  "MoonToMoonInsertionBurn", MoonToMoonInsertionBurn@
  ).
///
/// INTERPLANETARY
///

Function InsertionBurn {
  Parameter TargetDestination.
  Parameter TargetPeriapsis.

  T_Warp["WarpToPhaseAngle"](TargetDestination, 1).
  T_Warp["WarpToEjectionAngle"](TargetDestination, 1).
  local ResultList is T_PhaseAngle["EjectionAngleVelocityCalculation"](TargetDestination).
  local InsertionBurnDv is ResultList[1].

  local NewList is list(time:seconds + 300, 0, 0, InsertionBurnDv).

  local NewScoreList is list(TargetDestination, TargetPeriapsis).
  local NewRestrictionList is T_HillUni["IndexFiveFolderder"]("none").
  local FinalMan is T_HillUni["ResultFinder"](NewList, "Interplanetary", NewScoreList, NewRestrictionList).
  T_ManeuverExecute["ExecuteManeuver"](FinalMan).
}

Function ExitSOI {
  parameter TargetDestination.

  local SOIChange is time:seconds + eta:transition - 5.
  warpto(SOIChange).
  wait until time:seconds > SOIChange + 10.
  if ship:orbit:hasnextpatch = false  {
    return true.
  } else if ship:orbit:hasnextpatch = true and ship:orbit:nextpatch:body = TargetDestination {
    return false.
  } else {
    return true.
  }
}

Function CorrectionBurn {
  Parameter TargetDestination.
  Parameter TargetPeriapsis.

  local NewList is list(time:seconds + 300, 0, 0, 0).
  local NewScoreList is list(TargetDestination, TargetPeriapsis).
  local NewRestrictionList is T_HillUni["IndexFiveFolderder"]("none").
  local FinalMan is T_HillUni["ResultFinder"](NewList, "Interplanetary", NewScoreList, NewRestrictionList).
  T_ManeuverExecute["ExecuteManeuver"](FinalMan).
}

Function FinalCorrectionBurn {
  Parameter TargetDestination.
  Parameter TargetPeriapsis.
  Parameter TargetInclination.

  local NewList is list(time:seconds + 300, 0, 0, 0).

  local NewScoreList is list(TargetDestination, TargetPeriapsis, TargetInclination).
  local NewRestrictionList is T_HillUni["IndexFiveFolderder"]("prograde_retrograde").
  local FinalMan is T_HillUni["ResultFinder"](NewList, "FinalCorrection", NewScoreList, NewRestrictionList).
  T_ManeuverExecute["ExecuteManeuver"](FinalMan).
}

///
/// MOONS
///

Function MoonInsertionBurn {
  Parameter TargetDestination.
  Parameter TargetPeriapsis.
  Parameter TargetInclination.

  local CombinedSMA is (TargetDestination:orbit:semimajoraxis + ship:altitude + ship:body:radius)/2.
  local RoughDv is T_Other["VisViva"](ship:altitude, CombinedSMA).

  local NewList is list(time:seconds + 30, 0, 0, RoughDv).
  local NewScoreList is list(TargetDestination, TargetPeriapsis, TargetInclination).
  local NewRestrictionList is list(
    "retrograde_realnormal_antinormal_radialin_radialout",
    "none",
    "none",
    "none",
    "none"
    ).
  // ^^^ first value retrograde
  local FinalMan is T_HillUni["ResultFinder"](NewList, "MoonTransfer", NewScoreList, NewRestrictionList).
  T_ManeuverExecute["ExecuteManeuver"](FinalMan).
}

Function MoonCorrectionBurn {
  Parameter TargetDestination.
  Parameter TargetPeriapsis.
  Parameter TargetInclination.

  local NewList is list(time:seconds + 180, 0, 0, 0).
  local NewScoreList is list(TargetDestination, TargetPeriapsis, TargetInclination).
  local NewRestrictionList is T_HillUni["IndexFiveFolderder"]("none").
  local FinalMan is T_HillUni["ResultFinder"](NewList, "MoonTransfer", NewScoreList, NewRestrictionList).
  T_ManeuverExecute["ExecuteManeuver"](FinalMan).
}

Function MoonPostEncounterBurn {
  Parameter TargetPeriapsis.
  Parameter TargetInclination.

  print "post correcting".

  // NOTE following piece of code is not used but might still be handy for reference
  if periapsis < 30000 {
    local NewList is list(time:seconds + 30, 0, 0, 0).
    local NewScoreList is list(30000).
    local NewRestrictionList is T_HillUni["IndexFiveFolderder"]("realnormal_antinormal_timeplus_timemin_prograde_retrograde").
    local FinalMan is T_HillUni["ResultFinder"](NewList, "Periapsis", NewScoreList, NewRestrictionList).
    T_ManeuverExecute["ExecuteManeuver"](FinalMan).
  } else {
    print "periapsis is looking good".
  }

  wait 1.
  print "incl " + abs(ship:orbit:inclination - TargetInclination).
  if abs(ship:orbit:inclination - TargetInclination) < 10 {
    local NewList is list(time:seconds + 30, 0, 0, 0).
    local NewScoreList is list(TargetInclination).
    local NewRestrictionList is T_HillUni["IndexFiveFolderder"]("prograde_retrograde").
    local FinalMan is T_HillUni["ResultFinder"](NewList, "Inclination", NewScoreList, NewRestrictionList).
    T_ManeuverExecute["ExecuteManeuver"](FinalMan).
  } else {
    print "inclination looking G.O.O.D.".
  }
}

Function InclinationMatcher2 {
  Parameter TargetInclination.

  local TrueAnomAN is 360 - ship:orbit:argumentofperiapsis.
  local TrueAnomDN is TrueAnomAN + 180.

  if TrueAnomAN < 0 {
    set TrueAnomAN to TrueAnomAN + 360.
  }

  if TrueAnomDN > 360 {
    set TrueAnomDN to TrueAnomDN - 360.
  }

  print TrueAnomAN.
  print TrueAnomDN.

  local TimeNeeded is "x".
  local TimeAN is T_TrueAnomaly["ETAToTrueAnomaly"](ship, TrueAnomAN).
  local TimeDN is T_TrueAnomaly["ETAToTrueAnomaly"](ship, TrueAnomDN).
  local ThetaChange is abs(ship:orbit:inclination - TargetInclination).

  local ANDv is T_Inclination["DeltaVTheta"](TrueAnomAN, ThetaChange).
  local DNDv is T_Inclination["DeltaVTheta"](TrueAnomDN, ThetaChange).

  local DvNeeded is min(ANDv, DNDv).

  if ANDv < DNDv {
    set TimeNeeded to TimeAN.
    set DvNeeded to -1*DvNeeded.
  } else {
    set TimeNeeded to TimeDN.
  }

  if abs(ship:orbit:inclination - TargetInclination) > 0.1 {
    local NewList is list(time:seconds + TimeNeeded, 0, DvNeeded, 0).
    local NewScoreList is list(TargetInclination).

    local NewRestrictionList is "x".
    if abs(ship:orbit:inclination - TargetInclination) > 90 {
      print "over 90 deg diff".
      set NewRestrictionList to T_HillUni["IndexFiveFolderder"]("timeplus_prograde_retrograde").
    } else {
      print "under 90 deg diff".
      set NewRestrictionList to T_HillUni["IndexFiveFolderder"]("timeplus_timemin_prograde_retrograde_radialin_radialout").
    }

    local FinalMan is T_HillUni["ResultFinder"](NewList, "Inclination", NewScoreList, NewRestrictionList).
    T_ManeuverExecute["ExecuteManeuver"](FinalMan).
  }
}

///
/// MOON TO MOON (AKA SEMI INTERPLANETARY)
///

Function MoonToMoonInsertionBurn {
  Parameter TargetDestination.
  Parameter TargetPeriapsis.

  local testph is T_PhaseAngle["PhaseAngleCalculation"](TargetDestination, ship:body, ship:body:body).
  HUDtext("Phase angle " + testph, 5, 2, 30, red, true).

  T_Warp["WarpToPhaseAngle"](TargetDestination, 1, ship:body, ship:body:body, 10000).
  T_Warp["WarpToEjectionAngle"](TargetDestination, 1, ship:body, ship:body:body).
  local ResultList is T_PhaseAngle["EjectionAngleVelocityCalculation"](TargetDestination, ship:body).
  local InsertionBurnDv is ResultList[1].

  local NewList is list(time:seconds + 300, 0, 0, InsertionBurnDv).
  local NewScoreList is list(TargetDestination, TargetPeriapsis).
  local NewRestrictionList is T_HillUni["IndexFiveFolderder"]("retrograde_realnormal_antinormal_radialin_radialout").
  local FinalMan is T_HillUni["ResultFinder"](NewList, "Interplanetary", NewScoreList, NewRestrictionList).
  T_ManeuverExecute["ExecuteManeuver"](FinalMan).

}

}

print "read lib_transfer_burns".
