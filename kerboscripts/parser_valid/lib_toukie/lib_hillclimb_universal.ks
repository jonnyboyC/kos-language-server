@lazyglobal off.

{

local BestCandidate is list().
local Candidates    is list().

///
/// MAIN
///
// if input = output --> no progress, move on!

global T_HillUni is lex(
  "ResultFinder",        ResultFinder@,
  "ScoreImproveCompare", ScoreImproveCompare@,
  "Score",               Score@,
  "ScoreExecuter",       ScoreExecuter@,
  "StepFunction",        StepFunction@,
  "EvenOrUnevenChecker", EvenOrUnevenChecker@,
  "Improve",             Improve@,
  "IndexFiveFolderder", IndexFiveFolderder@
  ).

Function ResultFinder {
  Parameter NodeList.
  Parameter ScoreType.
  Parameter ScoreList.
  Parameter RestrictionTypeList.

  local Best100dv is ScoreImproveCompare(NodeList,  ScoreType, ScoreList, RestrictionTypeList[0], 100).
  local Best10dv  is ScoreImproveCompare(Best100dv, ScoreType, ScoreList, RestrictionTypeList[1], 10).
  local Best1dv   is ScoreImproveCompare(Best10dv,  ScoreType, ScoreList, RestrictionTypeList[2], 1).
  local Best01dv  is ScoreImproveCompare(Best1dv,   ScoreType, ScoreList, RestrictionTypeList[3], 0.1).
  return             ScoreImproveCompare(Best01dv,  ScoreType, ScoreList, RestrictionTypeList[4], 0.01).
}

Function ScoreImproveCompare {
  Parameter InitialNodeList.
  Parameter ScoreType.
  Parameter ScoreList.
  Parameter RestrictionType.
  Parameter Increment.

  local NodeList is InitialNodeList:copy.
  local CurrentDv is CurrentDVGetterx().

  until false {
    local OldNodeList is NodeList:copy.
    local OldScore is Score(OldNodeList, ScoreType, ScoreList, CurrentDv).
    set NodeList to Improve(OldNodeList, ScoreType, ScoreList, CurrentDv, RestrictionType, Increment).
    local NewScore is Score(NodeList, ScoreType, ScoreList, CurrentDv).
    if round(OldScore, 6) <= round(NewScore, 6) {
      return OldNodeList.
    }
  }
}

///
/// SCORE
///

Function Score {
  Parameter NodeList.
  Parameter ScoreType.
  Parameter ScoreList.
  Parameter DeltaVCap.

  local ScoreManeuver is node(NodeList[0], NodeList[1], NodeList[2], NodeList[3]).
  add   ScoreManeuver.
  wait until hasnode = true.
  local Result is 20^63.

  if  Result = 20^63 {
  set Result to ScoreExecuter(ScoreType, "Circularize", ScoreList).
  }

  if  Result = 20^63 {
  set Result to ScoreExecuter(ScoreType, "Inclination", ScoreList).
  }

  if  Result = 20^63 {
  set Result to ScoreExecuter(ScoreType, "Apoapsis", ScoreList).
  }

  if  Result = 20^63 {
  set Result to ScoreExecuter(ScoreType, "Periapsis", ScoreList).
  }

  if  Result = 20^63 {
  set Result to ScoreExecuter(ScoreType, "ApoapsisMatch", ScoreList).
  }

  if  Result = 20^63 {
  set Result to ScoreExecuter(ScoreType, "PerApoMatch", ScoreList).
  }

  if  Result = 20^63 {
  set Result to ScoreExecuter(ScoreType, "PerPerMatch", ScoreList).
  }

  if  Result = 20^63 {
  set Result to ScoreExecuter(ScoreType, "MoonTransfer", ScoreList).
  }

  if  Result = 20^63 {
  set Result to ScoreExecuter(ScoreType, "Interplanetary", ScoreList).
  }

  if Result = 20^63 {
  set Result to ScoreExecuter(ScoreType, "FinalCorrection", ScoreList).
  }

  if Result = 20^63 {
    print "ERROR! ScoreType not added to list of available score types in: lib_hillclimb_universal Score().".
  }

  if ScoreManeuver:deltav:mag > DeltaVCap {
    set Result to 2^64.
    print "surpased delta v cap              " at (1, 26).
  }

  if ScoreManeuver:eta < 0 {
    set Result to -1*((2^64)/ScoreManeuver:eta).
    print "eta too close                     " at (1, 26).
    local TimeCopy is BestCandidate[0].
    BestCandidate:remove(0).
    if time:seconds < TimeCopy {
      BestCandidate:insert(0, TimeCopy+30).
    } else {
      BestCandidate:insert(0, time:seconds+30).
    }

  }

  if ship:body:atm:exists = true {
    if ScoreManeuver:orbit:periapsis < ship:body:atm:height {
      set Result to 2^64.
      print "periapsis under atm            " at(1,26).
    }
  }

  if ScoreManeuver:orbit:periapsis < 0 {
    set Result to 2^64.
    print "periapsis under surf            " at(1,26).
  }

  if Result < 0 {
    set Result to 2^64.
    print "result under 0            " at(1,26).
  }

  remove ScoreManeuver.
  return Result.
}

Function ScoreExecuter {
  Parameter ScoreType.
  Parameter WantedScoreType.
  Parameter ScoreList.

  if ScoreType = WantedScoreType {
    //print "its a go".
    return T_ScoreOptions[WantedScoreType](ScoreList).
  } else {
    return 20^63.
  }
}

///
/// IMPROVE
///

local StepOptions is lex(
  "timeplus",   0,
  "timemin",    1,
  "radialout",  2,
  "radialin",   3,
  "realnormal", 4,
  "antinormal", 5,
  "prograde",   6,
  "retrograde", 7
).

local StepSizeList is list(
  0, 0, 0, 0, 0, 0, 0, 0
).

Function StepFunction {
  Parameter StepType.
  Parameter StepSize.
  Parameter NodeList.
  Parameter RestrictionType.

  local EmptyStepList is StepSizeList:copy.

  if EvenOrUnevenChecker(StepOptions[StepType]) = "uneven" {
    set StepSize to -1 * StepSize.
  }

  if not RestrictionType:contains(StepType) {

    StepSizeList:remove(StepOptions[StepType]).
    StepSizeList:insert(StepOptions[StepType], StepSize).

    Candidates:add(list(
      NodeList[0]+StepSizeList[0]+StepSizeList[1],
      NodeList[1]+StepSizeList[2]+StepSizeList[3],
      NodeList[2]+StepSizeList[4]+StepSizeList[5],
      NodeList[3]+StepSizeList[6]+StepSizeList[7])).

    set StepSizeList to EmptyStepList.
  } else {
    print "Restriction found!" at(1,25).
    Candidates:add(list(NodeList[0], NodeList[1], NodeList[2], constant():pi)).
  }
}

Function EvenOrUnevenChecker {
  Parameter Number.

  if floor(Number/2) = ceiling(Number/2) {
    return "even".
  } else {
    return "uneven".
  }
}

Function Improve {
  Parameter NodeList.
  Parameter ScoreType.
  Parameter ScoreList.
  Parameter CurrentDv.
  Parameter RestrictionType.
  Parameter Increment.

  local ScoreToBeat   is Score(NodeList, ScoreType, ScoreList, CurrentDv).
  set BestCandidate to NodeList:copy.
  set Candidates    to list().
  local CandidateScore is 2^60.
  wait 0.

  StepFunction("timeplus",   Increment, NodeList, RestrictionType).
  StepFunction("timemin",    Increment, NodeList, RestrictionType).
  StepFunction("radialout",  Increment, NodeList, RestrictionType).
  StepFunction("radialin",   Increment, NodeList, RestrictionType).
  StepFunction("realnormal", Increment, NodeList, RestrictionType).
  StepFunction("antinormal", Increment, NodeList, RestrictionType).
  StepFunction("prograde",   Increment, NodeList, RestrictionType).
  StepFunction("retrograde", Increment, NodeList, RestrictionType).

  for Candidate in Candidates {
    if Candidate[3] = constant():pi {
      set CandidateScore to 2^64.
    } else {
    set CandidateScore to Score(Candidate, ScoreType, ScoreList, CurrentDv).
    }
    //clearscreen.
    set CandidateScore to round(CandidateScore, 5).
    set ScoreToBeat to round(ScoreToBeat, 5).
    print "CandidateScore: " + CandidateScore + "                     "at (1,28).
    print "ScoreToBeat..:    " + ScoreToBeat + "                        " at (1,29).
    T_ReadOut["CandidateScoreGUI"](CandidateScore, ScoreToBeat).
    if CandidateScore < ScoreToBeat {
      set ScoreToBeat to CandidateScore.
      set BestCandidate to Candidate.
    }
  }
  return BestCandidate.
  }

Function CurrentDVGetterx {
  local eIsp is 0.
  local MyEngs is list().
  list engines in MyEngs.
  for Eng in MyEngs {
    local EngMaxThrust is max(0.001, eng:maxthrust).
    set eIsp to eISP + ((EngMaxThrust/maxthrust)*eng:isp).
  }
  local Ve is eIsp * 9.80665.

  return (Ve * ln(ship:mass / ship:drymass)).
}

Function IndexFiveFolderder {
  parameter WantedIndex.

  return list(WantedIndex, WantedIndex, WantedIndex, WantedIndex, WantedIndex).
}
///
/// END OF MAIN BRACKETS
///

}



print "read lib_hillclimb_universal".
