@lazyglobal off.

{

global T_Rendezvous is lexicon(
  "CompleteRendezvous", CompleteRendezvous@
  ).

local FinalMan is "x".

Function EnsureSmallerOrbit {
  Parameter TargetDestination.

  if ship:orbit:periapsis > TargetDestination:orbit:periapsis {
    local DvNeeded is T_Other["VisViva"](ship:orbit:apoapsis, (ship:orbit:apoapsis + 0.9*TargetDestination:periapsis)/2 + ship:body:radius).
    local LowerList1 is list(time:seconds+eta:apoapsis, 0, 0, DvNeeded).
    T_ManeuverExecute["ExecuteManeuver"](LowerList1).
  }

  if ship:orbit:apoapsis > TargetDestination:orbit:apoapsis {
    local DvNeeded is T_Other["VisViva"](ship:orbit:periapsis, (ship:orbit:periapsis + 0.9*TargetDestination:apoapsis)/2 + ship:body:radius).
    local LowerList2 is list(time:seconds+eta:periapsis, 0, 0, DvNeeded).
    T_ManeuverExecute["ExecuteManeuver"](LowerList2).
  }
}

Function RendezvousSetup {

  parameter TargetDestination.

	if true = false {
      local ArgOfPer1 is ship:orbit:argumentofperiapsis.
      local ArgOfPer2 is TargetDestination:orbit:argumentofperiapsis.
      local TrueAnomalyTargetPer is ArgOfPer2-ArgOfPer1.
	  
	  HUDtext("TA of target Pe on current orbit: " + TrueAnomalyTargetPer, 15, 2, 30, red, true).

        if TrueAnomalyTargetPer < 0 {
        set TrueAnomalyTargetPer to 360 - abs(TrueAnomalyTargetPer).
		HUDtext("TA of target Pe on current orbit: " + TrueAnomalyTargetPer, 15, 2, 30, yellow, true).
      }
	 }
	  
	  local Per1 is time:seconds + T_TrueAnomaly["ETAToTrueAnomaly"](ship, 0).
	  local Per2 is time:seconds + T_TrueAnomaly["ETAToTrueAnomaly"](TargetDestination, 0).

	  local vec1 is positionat(ship, per1)-ship:body:position.
	  local vecd1 is vecdraw(ship:body:position, vec1 , red, "per1", 1.0, false, 0.2).
	  set vecd1:startupdater to {return ship:body:position.}.

	  local vec2 is positionat(target, per2)-ship:body:position.
	  local vecd2 is vecdraw(ship:body:position, vec2, red, "per2", 1.0, false, 0.2).
	  set vecd2:startupdater to {return body:position.}.

	  local TrueAnomalyTargetPer is vang(vec1,vec2).

      local TimeTargetPeriapsis is T_TrueAnomaly["ETAToTrueAnomaly"](ship, TrueAnomalyTargetPer).

      //print "Time till target periapsis:   " + TimeTargetPeriapsis.

      local SMA is ship:orbit:semimajoraxis.
      local Ecc is ship:orbit:eccentricity.
      local CurRadiusAtTargetPeriapsis is (SMA * ( (1-ecc^2) / (1+ecc*cos(TrueAnomalyTargetPer))))-body:radius.
      local FinalMan is "x".

      if ship:orbit:semimajoraxis < TargetDestination:orbit:semimajoraxis {
        local InputList is list(time:seconds + TimeTargetPeriapsis, 0, 0, 0).
        local NewScoreList is list(TargetDestination).
        local NewRestrictionList is T_HillUni["IndexFiveFolderder"]("realnormal_antinormal_radialout_radialin_timeplus_timemin").
        set FinalMan to T_HillUni["ResultFinder"](InputList, "ApoapsisMatch", NewScoreList, NewRestrictionList).
      } else {
        local InputList is list(time:seconds + TimeTargetPeriapsis, 0, 0, 0).
        local NewScoreList is list(TargetDestination).
        local NewRestrictionList is T_HillUni["IndexFiveFolderder"]("realnormal_antinormal_radialout_radialin_timeplus_timemin").
        set FinalMan to T_HillUni["ResultFinder"](InputList, "PerApoMatch", NewScoreList, NewRestrictionList).
      }

      T_ManeuverExecute["ExecuteManeuver"](FinalMan).
}

Function MatchOrbit {
  Parameter TargetDestination.

  local ThetaChange is T_Inclination["RelativeAngleCalculation"](TargetDestination).

  print "Matching inclination".

  until ThetaChange < 0.04 {
   T_Inclination["InclinationMatcher"](TargetDestination).
   set ThetaChange to T_Inclination["RelativeAngleCalculation"](TargetDestination).
  }

  EnsureSmallerOrbit(TargetDestination).

  print "Circularizing".

  if ship:orbit:eccentricity > 0.00001 {
    local InputList is list().
    if ship:orbit:apoapsis > TargetDestination:orbit:periapsis {
      set InputList to list(time:seconds + eta:periapsis, 0, 0, 0).
    } else {
      set InputList to list(time:seconds + eta:apoapsis, 0, 0, 0).
    }
    local NewScoreList is list(TargetDestination).
    local NewRestrictionList is T_HillUni["IndexFiveFolderder"]("realnormal_antinormal").
    set FinalMan to T_HillUni["ResultFinder"](InputList, "Circularize", NewScoreList, NewRestrictionList).
    T_ManeuverExecute["ExecuteManeuver"](FinalMan).
  }



  print "Rendezvous approach".

  RendezvousSetup(TargetDestination).


  if ship:orbit:periapsis*1.05 > TargetDestination:orbit:apoapsis {
    print "lowering orbit".
    local DvNeeded is T_Other["VisViva"](ship:orbit:periapsis, (ship:orbit:periapsis+2*ship:body:radius+(0.8*TargetDestination:orbit:periapsis))/2).
    local LowerList is list(time:seconds+eta:periapsis, 0, 0, DvNeeded).
    T_ManeuverExecute["ExecuteManeuver"](LowerList).
  }

    print "Matching up orbit".
    local InputList is list(time:seconds + eta:apoapsis, 0, 0, 0).
    local NewScoreList is list(TargetDestination).
    local NewRestrictionList is T_HillUni["IndexFiveFolderder"]("realnormal_antinormal_radialout_radialin_timeplus_timemin").
    set FinalMan to T_HillUni["ResultFinder"](InputList, "PerPerMatch", NewScoreList, NewRestrictionList).
    T_ManeuverExecute["ExecuteManeuver"](FinalMan).
}

Function FinalApproach {
  Parameter TargetDestination.
  Parameter StepsNeeded is 1.

  local TimeTillDesiredTrueAnomaly is T_TrueAnomaly["ETAToTrueAnomaly"](TargetDestination, 180, eta:apoapsis).

  local CurPeriod is ship:orbit:period.
  local TarPeriod is CurPeriod + (TimeTillDesiredTrueAnomaly/StepsNeeded).

  local TarSMA is (((TarPeriod^2)*ship:body:mu)/(4*constant:pi^2))^(1/3).

  local DvNeeded is T_Other["VisViva"](ship:orbit:apoapsis, TarSMA).
  local ApproachList is list(time:seconds+eta:apoapsis, 0, 0, DvNeeded).
  local ApproachNode is node(ApproachList[0], ApproachList[1], ApproachList[2], ApproachList[3]).
  add ApproachNode.
  wait 0.

  if nextnode:orbit:hasnextpatch {
    if nextnode:orbit:nextpatch:body <> ship:orbit:body{
      until nextnode:orbit:nextpatch:body = ship:orbit:body{
        set StepsNeeded to StepsNeeded + 1.

        set CurPeriod to ship:orbit:period.
        set TarPeriod to CurPeriod + (TimeTillDesiredTrueAnomaly/StepsNeeded).

        set TarSMA to (((TarPeriod^2)*ship:body:mu)/(4*constant:pi^2))^(1/3).

        local DvNeeded is T_Other["VisViva"](ship:orbit:apoapsis, TarSMA).
        set ApproachList to list(time:seconds+eta:apoapsis, 0, 0, DvNeeded).
      }
    }
  }

  remove ApproachNode.
  T_ManeuverExecute["ExecuteManeuver"](ApproachList).

  wait 5.
  local TargetTime is "x".
  if StepsNeeded > 1 {
    set TargetTime to time:seconds + (StepsNeeded-1)*ship:orbit:period.
    warpto(TargetTime).
  } else {
    set TargetTime to time:seconds + 0.75*ship:orbit:period.
    warpto(TargetTime).
  }
  //print "warping some more".
  wait until time:seconds > TargetTime.
  wait 5.
  local TimeTillDesiredTrueAnomaly is T_TrueAnomaly["ETAToTrueAnomaly"](TargetDestination, 180).
  set TargetTime to time:seconds+TimeTillDesiredTrueAnomaly.
  warpto(TargetTime).
  //print "warped some more".
  wait until time:seconds > TargetTime.
  wait 7.

  local Distance is (TargetDestination:position - ship:position):mag.
  if  Distance > 50000 {
    //print "too far away, warping again".
    local TimeTillDesiredTrueAnomaly is T_TrueAnomaly["ETAToTrueAnomaly"](TargetDestination, 180).
    set TargetTime to time:seconds+TimeTillDesiredTrueAnomaly.
    warpto(TargetTime).
    wait until time:seconds > TargetTime.
  }
}

Function MainRelVelKill {
  Parameter TargetDestination.

  local VectorNeeded is (TargetDestination:velocity:orbit - ship:velocity:orbit).
  local NodeList is T_Other["NodeFromVector"](VectorNeeded).
  T_ManeuverExecute["ExecuteManeuver"](NodeList).
}

Function GoToTarget {
  Parameter TargetDestination.
  Parameter SpeedNeeded.

  local InitialVector is TargetDestination:position - ship:position.
  local VectorNeeded  is InitialVector:normalized * SpeedNeeded.
  local NodeList is T_Other["NodeFromVector"](VectorNeeded).
  T_ManeuverExecute["ExecuteManeuver"](NodeList).
}

Function VeryFinalApproach {

  Parameter TargetDestination.

  local lock Distance to (TargetDestination:position - ship:position):mag.
  set warpmode to "rails".

  if Distance > 15000 {
    MainRelVelKill(TargetDestination).
    T_Steering["SteeringTarget"](TargetDestination).
    GoToTarget(TargetDestination, 50).
    T_Steering["SteeringTargetRet"](TargetDestination).
    set warp to 2.
    wait until Distance < 10000.
    set warp to 0.
    MainRelVelKill(TargetDestination).
  }

  if Distance > 3000 {
    //print "3000 meters".
    MainRelVelKill(TargetDestination).
    T_Steering["SteeringTarget"](TargetDestination).
    GoToTarget(TargetDestination, 30).
    T_Steering["SteeringTargetRet"](TargetDestination).
    set warp to 1.
    wait until Distance < 1000.
    set warp to 0.
    MainRelVelKill(TargetDestination).
  }

  MainRelVelKill(TargetDestination).
  T_Steering["SteeringTarget"](TargetDestination).
  GoToTarget(TargetDestination, 10).
  T_Steering["SteeringTargetRet"](TargetDestination).
  wait until Distance < 275.
  MainRelVelKill(TargetDestination).
}

Function CompleteRendezvous {
  Parameter TargetDestination.

  local Distance is (TargetDestination:position - ship:position):mag.
  if Distance > 7500 {
    MatchOrbit(TargetDestination).
    FinalApproach(TargetDestination, 5).
  }
  MainRelVelKill(TargetDestination).
  VeryFinalApproach(TargetDestination).
}

}

print "read lib_rendezvous".
