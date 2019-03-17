//ep4
print "running function.ks".


////    Functions in the currrent function.ks file:
////
////	Execute_Ascent_Step        preforms the current steps for the ascent list.
////	Execute_Ascent_Profile     adds steps to the ascent list.
////	LNG_to_Degrees             adds 360 and then removes as many 360s as possible (from longitude -> degrees).
////	Target_Angle               gives angle between current vessel and target vessel/body.
////	Ish                        makes sure something is about the same. 5, 7 ish 2 would be correct, ish 0.02 wouldn't.
////	VangPro                    adds 'FakeNode' to prograde and waits till ship is pointing prograde.
////	VangRet                    adds 'FakeNode' to prograde and waits till ship is pointing retrograde.
////	Endstage                   needs parameter for which stage is the heatshield stage, stages till heatshield stage.
////	Endstaging                 repeats endstage function ten times.
////	ApoWarp                    warps to 3 min before apoapsis.
////	PerWarp                    warps to 3 min before periapsis.
////	BodyScript                 fly-by script to a body, returns into a 150 km orbit when done.
////	Deorbit                    de-orbits to 30 km and warps.
////	LandingAtmo                waits till 20 km and deploys parachutes.
////	DvCalc                     calculates Hohmann stuff.
////	TCalc                      calculates time needed to burn (should work with all nodes).
////	ExecuteBurn                executes first Hohmann burn.
////	ExecuteBurn2               circularizes with seconds burn.
////	DeorbitBurn                de-orbits with deadly precision.
////	TiToIm                     time to impact calculator, gets more accurate the closer you are to the surface.
////	VisViva                    speed calculation at any point of eliptical / circular orbit.
////	Impact_eta                 calculates time to impact with deadly precision (set the parameter to (time:seconds)).
////	pid_init                   PID stuff pt.1.
////	pid_seek                   PID stuff pt.2.
////	NoAtmosLanding             preforms suicide burn and uses PID to land softly.
////

FUNCTION EXECUTE_ASCENT_STEP {
  PARAMETER direction.
  PARAMETER minAlt.
  PARAMETER newAngle.
  PARAMETER newThrust.

  SET prevThrust TO MAXTHRUST.

  UNTIL FALSE {

    IF ALTITUDE > minAlt {
      LOCK STEERING TO HEADING(direction, newAngle).
      LOCK THROTTLE TO newThrust.
      BREAK.
    }

    WAIT 0.1.
  }
}

////
////
////

FUNCTION EXECUTE_ASCENT_PROFILE {
  PARAMETER direction.
  PARAMETER profile.

  SET step TO 0.
  UNTIL step >= profile:length - 1 {
    EXECUTE_ASCENT_STEP(
      direction,
      profile[step],
      profile[step+1],
      profile[step+2]
    ).
    SET step TO step + 3.
  }
}

////
////
////

FUNCTION LNG_TO_DEGREES{
  PARAMETER lng.

  RETURN MOD(lng +360, 360).
}

////
////
////

FUNCTION TARGET_ANGLE {
  PARAMETER targget.

  RETURN MOD(
  LNG_TO_DEGREES(Targget:longitude) - LNG_TO_DEGREES(SHIP:LONGITUDE)+360, 360
  ).
}

////
////
////

FUNCTION ISH{
  PARAMETER a.
  PARAMETER b.
  PARAMETER ishyness.

  RETURN a-ishyness < b AND a+ishyness > b.
}

////
////
////

FUNCTION VANGPRO{
  SET OLDPRO TO PROGRADE.
  lock steering to OLDPRO.
  SET FakeNode TO NODE(time:seconds, 0, 0, 100).
  Add FakeNode.
  wait until vang(ship:facing:vector, Fakenode:Burnvector) <2.
  wait 3.
  remove FakeNode.
}

////
////
////

FUNCTION VANGRET{
  SET OLDRET TO RETROGRADE.
  lock steering to OLDRET.
  SET FakeNodeX TO NODE(time:seconds, 0, 0, -100).
  Add FakeNodeX.
  wait until vang(ship:facing:vector, FakenodeX:Burnvector) <2.
  wait 3.
  remove FakeNodeX.
}

////
////STAGEX=heatshield stage
////

FUNCTION ENDSTAGE {
    PARAMETER STAGEX.
    set currentstage TO stage:number.
		IF  currentstage > stagex {
  	wait 2.
  	print " |" + (currentstage - stagex -1) + " remaining stages|".
	  stage.
    set currentstage TO stage:number.
  }
}

////
////
////

FUNCTION ENDSTAGING {
    PARAMETER STAGEX.
    ENDSTAGE(STAGEX).
    WAIT 1.
    ENDSTAGE(STAGEX).
    WAIT 1.
    ENDSTAGE(STAGEX).
    WAIT 1.
    ENDSTAGE(STAGEX).
    WAIT 1.
    ENDSTAGE(STAGEX).
    WAIT 1.
    ENDSTAGE(STAGEX).
    WAIT 1.
    ENDSTAGE(STAGEX).
    WAIT 1.
    ENDSTAGE(STAGEX).
    WAIT 1.
    ENDSTAGE(STAGEX).
    WAIT 1.
    ENDSTAGE(STAGEX).
}

////
////
////

FUNCTION APOWARP {
  IF ETA:APOAPSIS > 21600 {
    set kuniverse:timewarp:warp to 6.
    } ELSE {
      set kuniverse:timewarp:warp to 5.
      }
    WAIT UNTIL ETA:APOAPSIS <21600.
    set kuniverse:timewarp:warp to 5.
    WAIT UNTIL eta:apoapsis < 2700.
    set kuniverse:timewarp:warp to 4.
    WAIT UNTIL ETA:APOAPSIS < 900.
    set kuniverse:timewarp:warp to 3.
    WAIT UNTIL ETA:APOAPSIS < 300.
    set kuniverse:timewarp:warp to 2.
    WAIT UNTIL ETA:APOAPSIS < 180.
    set kuniverse:timewarp:warp to 0.
}

////
////
////

FUNCTION PERWARP {
  IF ETA:PERIAPSIS > 21600 {
    set kuniverse:timewarp:warp to 6.
    } ELSE {
      set kuniverse:timewarp:warp to 5.
      }
    WAIT UNTIL ETA:PERIAPSIS <21600.
    set kuniverse:timewarp:warp to 5.
    WAIT UNTIL eta:periapsis < 2700.
    set kuniverse:timewarp:warp to 4.
    WAIT UNTIL ETA:PERIAPSIS < 900.
    set kuniverse:timewarp:warp to 3.
    WAIT UNTIL ETA:PERIAPSIS < 300.
    set kuniverse:timewarp:warp to 2.
    WAIT UNTIL ETA:PERIAPSIS < 180.
    set kuniverse:timewarp:warp to 0.
}

////
////
////

FUNCTION bodyscript{

Parameter Targget.

UNTIL ISH(TARGET_ANGLE(targget), 135, 0.5) {
	print target_angle(targget).
	WAIT 0.1.

	IF target_angle(targget) < 134.5 OR target_angle(targget) > 140 {
		set kuniverse:timewarp:warp to 3.
		WAIT UNTIL target_angle(targget) < 140 AND target_angle(targget) > 134.5.
		set kuniverse:timewarp:warp to 0.
		}
}

VANGPRO().
LOCK steering to prograde.
LOCK THROTTLE TO 1.
wait 1.
WAIT UNTIL APOAPSIS > targget:APOAPSIS.
LOCK THROTTLE TO 0.
wait 2.
set kuniverse:timewarp:warp to 3.
wait 10.
set kuniverse:timewarp:warp to 5.
wait 10.
set kuniverse:timewarp:warp to 6.

wait until ship:OBT:BODY:NAME <> "Kerbin".
set kuniverse:timewarp:warp to 4.
Print "welcome to " + targget + ", please do your science!".

If PERIAPSIS < 250 {
set kuniverse:timewarp:warp to 0.
	set FakeNode to NODE(time:seconds+25, 10000, 0, 0).
	add FakeNode.
	lock steering to Fakenode:burnvector.
	wait until vang(ship:facing:vector, Fakenode:Burnvector) <2.
	lock throttle to 1.
	wait until periapsis > 10000.
	lock throttle to 0.
  set kuniverse:timewarp:warp to 4.
}


WAIT UNTIL ship:OBT:BODY:NAME = "Kerbin".

IF ETA:APOAPSIS < ETA:PERIAPSIS{
APOWARP().
wait until eta:apoapsis < 20.
VANGRET().
lock steering to retrograde.
lock throttle to 1.
Wait until periapsis < 150000.
lock throttle to 0.
PERWARP().
wait until eta:periapsis < 30.
lock throttle to 1.
wait until periapsis < 149000.
lock throttle to 0.
wait 1.
RUN launch(Targget, Y, Y).
}

IF ETA:PERIAPSIS < ETA:APOAPSIS{
PERWARP().
WAIT UNTIL ETA:PERIAPSIS < 20.
VANGRET().
lock steering to retrograde.
lock throttle to 1.
Wait until periapsis < 150000.
lock throttle to 0.
PERWARP().
wait until eta:periapsis < 30.
lock throttle to 1.
wait until periapsis < 150000.
lock throttle to 0.
wait 1.
RUN launch(Targget, Y, Y).
}
}

////
////
////

FUNCTION DEORBIT{
IF PERIAPSIS AND APOAPSIS < 200000 {
  PERWARP().
  VANGRET().
  lock steering to retrograde.
  set kuniverse:timewarp:warp to 3.
  WAIT UNTIL ETA:PERIAPSIS < 60.
  set kuniverse:timewarp:warp to 0.
  WAIT UNTIL ETA:PERIAPSIS < 30.
  lock throttle to 1.
  Wait until periapsis < 30000.
  lock throttle to 0.
  ENDSTAGING(1).
  wait 5.
  set kuniverse:timewarp:warp to 4.
  WAIT UNTIL ALT:RADAR < 80000.
  set kuniverse:timewarp:warp to 0.
  } ELSE {
  //
  PERWARP().
  VANGRET().
  lock steering to retrograde.
  set kuniverse:timewarp:warp to 3.
  WAIT UNTIL ETA:PERIAPSIS < 60.
  set kuniverse:timewarp:warp to 0.
  WAIT UNTIL ETA:PERIAPSIS < 30.
  lock throttle to 1.
  Wait until PERIAPSIS < 150000.
  lock throttle to 0.
  WAIT 5.
  //
  PERWARP().
  VANGRET().
  lock steering to retrograde.
  set kuniverse:timewarp:warp to 3.
  WAIT UNTIL ETA:PERIAPSIS < 60.
  set kuniverse:timewarp:warp to 0.
  WAIT UNTIL ETA:PERIAPSIS < 30.
  lock throttle to 1.
  Wait until APOAPSIS < 150000.
  lock throttle to 0.
  WAIT 5.
  //
  PERWARP().
  VANGRET().
  lock steering to retrograde.
  set kuniverse:timewarp:warp to 3.
  WAIT UNTIL ETA:PERIAPSIS < 60.
  set kuniverse:timewarp:warp to 0.
  WAIT UNTIL ETA:PERIAPSIS < 30.
  lock throttle to 1.
  Wait until periapsis < 30000.
  lock throttle to 0.
  ENDSTAGING(1).
  wait 5.
  set kuniverse:timewarp:warp to 4.
  WAIT UNTIL ALT:RADAR < 80000.
  set kuniverse:timewarp:warp to 3.
  WAIT UNTIL ALT:RADAR < 75000.
  set kuniverse:timewarp:warp to 2.
  WAIT UNTIL ALT:RADAR < 70000.
  set kuniverse:timewarp:warp to 0.

  }
}

////
////
////

FUNCTION LANDINGATMO{
WAIT UNTIL ALT:RADAR < 15000.
STAGE.
WAIT UNTIL ALT:RADAR < 200.
UNLOCK STEERING.
}

////
////
////

FUNCTION DVCALC{

	PARAMETER 	TARGETHEIGHT.
	SET APKM 	TO ROUND(APOAPSIS/1000).
	SET TARKM 	TO ROUND(Targetheight/1000).
	SET mu 		TO SHIP:OBT:BODY:MU.
	SET KEO		TO 2863333.52.

	IF TARGETHEIGHT > SHIP:OBT:BODY:SOIRADIUS{
		Print "Error, target height exceeds SOI.".
		set dv to 0.
		print "Rebooting, please wait...".
		wait 5.
		reboot.
		} ELSE IF ALT:RADAR < 70000 {
		PRINT "Error, not in orbit.".
		set dv to 0.
		print "Rebooting, please wait...".
		wait 5.
		reboot.
		} ELSE IF TARGETHEIGHT < 70000 {
		PRINT "Error, target height not in space.".
		set dv to 0.
		print "Rebooting, please wait...".
		wait 5.
		reboot.
		} ELSE {

SET APH TO	(SHIP:OBT:BODY:RADIUS + APOAPSIS).
SET SMA TO	((SHIP:OBT:BODY:RADIUS + APOAPSIS + SHIP:OBT:BODY:RADIUS + PERIAPSIS)/2).
SET V02 TO	(mu * (2/APH - 1/SMA)).
SET V0 	TO	SQRT(V02).

SET SMAF 	TO	((SHIP:OBT:BODY:RADIUS + APOAPSIS + SHIP:OBT:BODY:RADIUS + TARGETHEIGHT)/2).
SET V12		TO	(mu * (2/APH - 1/SMAF)).
SET V1		TO	SQRT(V12).

SET DV		TO	(V1 - V0).
//// this value
SET DVISH	TO	ROUND(dv).
PRINT " " + DVISH + "  Dv needed to go in a " + TARKM + " x " + APKM + " orbit.".

// v1 is now speed at periapsis (after burn)

SET APH1	TO	(SHIP:OBT:BODY:RADIUS + TARGETHEIGHT).
SET V22		TO	(mu * (2/APH1 - 1/SMAF)).
SET V2		TO	SQRT(V22).

SET SMAF1	TO	(TARGETHEIGHT + SHIP:OBT:BODY:RADIUS).
SET V32		TO	(MU* (2/(TARGETHEIGHT + SHIP:OBT:BODY:RADIUS) - 1/SMAF1)).
SET V3		TO	SQRT(V32).

SET DV2		TO	(V3 - V2).
//// this value
SET DV2ISH	TO	ROUND(DV2).
PRINT " " + DV2ISH + "  Dv needed to go in a " + TARKM + " x " + TARKM + " orbit.".

SET DVTOT	TO	(DV + DV2).
SET DVTISH	TO	ROUND(DVTOT).
PRINT " " +	DVTISH + "  Dv needed for circurlarize.".

// deorbit burn calc

SET SMAF2	TO	((TARGETHEIGHT + SHIP:OBT:BODY:RADIUS + SHIP:OBT:BODY:RADIUS - 7500)/2).
SET V42		TO	(MU * (2/(TARGETHEIGHT + SHIP:OBT:BODY:RADIUS) - 1/SMAF2)).
SET V4		TO	SQRT(V42).

SET DV3		TO	(V3-V4).
//// this value
SET DV3ISH	TO	ROUND(DV3).
PRINT " " + DV3ISH + "  Dv needed to de-orbit.".

SET DVTOT2	TO	(DVTOT + DV3).
SET DVT2ISH TO	ROUND(DVTOT2).
PRINT "Total Dv (including de-orbit burn): " + DVT2ISH + ".".
}
}

/////
/////
/////

FUNCTION TCALC{

PARAMETER DeltaV.

SET mu	 TO SHIP:OBT:BODY:MU.
SET grav TO (MU/(SHIP:OBT:BODY:RADIUS^2)).

SET eIsp TO 0.
	List engines IN my_engines.
	For eng In my_engines{
		SET eIsp TO eISP + ((eng:maxthrust/maxthrust)*eng:isp).
	}

SET Ve 	 	TO (eIsp * grav).
SET m0 	 	TO ship:mass.
SET F 	 	TO	SHIP:MAXTHRUST.

SET	TMAX 	TO	(Ve * m0 * ( 1 - constant:e ^ (-DeltaV / Ve)) / F ).
}

////
////
////


FUNCTION executeburn {
PARAMETER TARGETHEIGHT.
PARAMETER DeltaV.

TCALC(DeltaV).

SET NewNode TO NODE(time:seconds + ETA:Apoapsis, 0, 0, DeltaV).
Add NewNode.
Lock steering TO NewNode:Burnvector.
SET start_t TO (TIME:SECONDS + NewNode:ETA - tmax/2).
wait 5.
APOWARP().
wait until vang(ship:facing:vector, NewNode:Burnvector) <2.
wait until Time:seconds >= start_t.
lock throttle to 1.
wait until apoapsis >= Targetheight * 0.95.
set throt to 0. // variable to hold current throttle value
    set scalefactor to 0.5. // scalefactor is some value based on the power of your engine
	SET TarApTar TO ((Targetheight - apoapsis)/Targetheight).
	SET TarApTarx TO TarApTar * scalefactor.
    lock throttle to thrott.
    until apoapsis >= (TargetHeight - 50) {
        set thrott to MAX(0, MIN(TarApTarx, 1)).
        wait 0.01.
    }

    lock throttle to 0. // kill throttle
	unlock steering.
	remove newnode.
	}

////
////
////

FUNCTION executeburn2 {
PARAMETER TARGETHEIGHT.
PARAMETER DeltaV.

TCALC(DeltaV).

SET NewNode1 TO NODE(time:seconds + ETA:Apoapsis, 0, 0, DeltaV).
Add NewNode1.
Lock steering TO NewNode1:Burnvector.
SET start_t TO (TIME:SECONDS + NewNode1:ETA - tmax/2).
wait 5.
APOWARP().
wait until vang(ship:facing:vector, NewNode1:Burnvector) <2.
wait until Time:seconds >= start_t.
lock throttle to 1.
wait until PERIAPSIS >= Targetheight * 0.95.
set throt to 0. // variable to hold current throttle value
    set scalefactor to 0.5. // scalefactor is some value based on the power of your engine
	SET TarApTar TO ((Targetheight - periapsis)/Targetheight).
	SET TarApTarx TO TarApTar * scalefactor.
    lock throttle to thrott.
    until PERIAPSIS >= (TargetHeight - 200) {
        set thrott to MAX(0, MIN(TarApTarx, 1)).
        wait 0.01.
    }

    lock throttle to 0. // kill throttle
	unlock steering.
	remove newnode1.
}

////
////
////

FUNCTION deorbitburn {
PARAMETER TARGETHEIGHT.
PARAMETER DeltaV.

TCALC(DeltaV).

SET NewNode2 TO NODE(time:seconds + ETA:Apoapsis, 0, 0, -DeltaV).
Add NewNode2.
Lock steering TO NewNode2:Burnvector.
SET start_t TO (TIME:SECONDS + NewNode2:ETA - tmax/2).
wait 5.
APOWARP().
wait until vang(ship:facing:vector, NewNode2:Burnvector) <2.
wait until Time:seconds >= start_t.
lock throttle to 1.
wait until periapsis <= -2500.
lock throttle to 0. // kill throttle
unlock steering.
remove newnode2.
ENDSTAGING(1).
wait 5.
set kuniverse:timewarp:warp to 4.
WAIT UNTIL ALT:RADAR < 80000.
set kuniverse:timewarp:warp to 3.
WAIT UNTIL ALT:RADAR < 75000.
set kuniverse:timewarp:warp to 2.
WAIT UNTIL ALT:RADAR < 70000.
set kuniverse:timewarp:warp to 0.
}

////
////
////

FUNCTION TiToIm {

PARAMETER Margin.

// cos true anomaly sma

		LOCAL geoimpactposition 	IS ADDONS:TR:IMPACTPOS.
		LOCAL eccx 					IS SHIP:ORBIT:ECCENTRICITY.
        LOCAL smaxx					IS SHIP:ORBIT:SEMIMAJORAXIS.
        LOCAL impactRadius 			IS geoimpactposition:TERRAINHEIGHT + SHIP:BODY:RADIUS.
        LOCAL currentRadius 		IS SHIP:ALTITUDE + SHIP:BODY:RADIUS.
        LOCAL impactTrueAnomalyCos	IS ((smaxx * (1-eccx^2) / impactRadius) - 1) / eccx.
        LOCAL currentTrueAnomalyCos IS ((smaxx * (1-eccx^2) / currentRadius) - 1) / eccx.

		PRINT geoimpactposition.
		print geoimpactposition:TERRAINHEIGHT.

// eccentric anomaly

		LOCAL eccAnomImp 			IS ARCCOS((eccx + impactTrueAnomalyCos)/(1 + eccx * impactTrueAnomalyCos)).
		LOCAL eccAnomCur			IS ARCCOS((eccx + currentTrueAnomalyCos)/(1 + eccx * currentTrueAnomalyCos)).

// Mean anomaly

		LOCAL MeanAnomImp			IS eccAnomImp - (eccx * SIN(eccAnomImp)).
		LOCAL MeanAnomCur			IS eccAnomCur - (eccx * SIN(eccAnomCur)).

// Mean notion anomaly

		LOCAL MeanNotion			IS (360 / SHIP:ORBIT:PERIOD).

// Time calc

		SET   TimeToImpactx			TO ((MeanAnomCur - MeanAnomImp) / MeanNotion).
		SET   TimeToImpactMarg		TO (TimeToImpactx - Margin).
		//SET   TimeMinx				TO ROUND(TimeToImpactx / 60).
		//PRINT TimeToImpact.
		//PRINT Impactradius.
}

////
////
////

FUNCTION VISVIVA{

PARAMETER Height.

Set GM	to body:mu.
Set v 	to ship:velocity. //vertical speed?
set r	to (Height + Body:radius).
set	SMA	to orbit:semimajoraxis.
set	v2	to (GM*((2/r) - (1/SMA))).
set vxx	to SQRT(v2).
print ROUND(vxx) + " Dv needed.".

}

////
////
////

FUNCTION impact_eta { //returns the impact time after the next node, note only works on airless bodies
  PARAMETER posTime. //posTime must be in UT seconds (TIME:SECONDS + x)
  LOCAL stepVal IS 100.
  LOCAL maxScanTime IS SHIP:ORBIT:PERIOD + posTime.
  IF (SHIP:ORBIT:PERIAPSIS < 0) AND (SHIP:ORBIT:TRANSITION <> "escape") {
    LOCAL localBody IS SHIP:BODY.
    LOCAL scanTime IS posTime.
    LOCAL targetAltitudeHi IS 1.
    LOCAL targetAltitudeLow IS 0.
    LOCAL pos IS POSITIONAT(SHIP,scanTime).
    LOCAL altitudeAt IS localBody:ALTITUDEOF(POSITIONAT(SHIP,scanTime)).
    //print "alttitudeAt " + altitudeAt.
    set stepper to 1.
    UNTIL (altitudeAt < targetAltitudeHi) AND (altitudeAt > targetAltitudeLow) {
      IF altitudeAt > targetAltitudeHi {
        //print "we to low " + stepper.
        set stepper to (stepper + 1).
        SET scanTime TO scanTime + stepVal.
        SET pos TO POSITIONAT(SHIP,scanTime).
        SET altitudeAt TO localBody:ALTITUDEOF(pos) - localBody:GEOPOSITIONOF(pos):TERRAINHEIGHT.
        IF altitudeAt < targetAltitudeLow {
          SET scanTime TO scanTime - stepVal.
          SET pos TO POSITIONAT(SHIP,scanTime).
          SET altitudeAt TO localBody:ALTITUDEOF(pos) - localBody:GEOPOSITIONOF(pos):TERRAINHEIGHT.
          SET stepVal TO stepVal / 2.
        }
      } ELSE IF altitudeAt < targetAltitudeLow {
        //print "we to high".
        SET scanTime TO scanTime - stepVal.
        SET pos TO POSITIONAT(SHIP,scanTime).
        SET altitudeAt TO localBody:ALTITUDEOF(pos) - localBody:GEOPOSITIONOF(pos):TERRAINHEIGHT.
        IF altitudeAt > targetAltitudeHi {
          SET scanTime TO scanTime + stepVal.
          SET pos TO POSITIONAT(SHIP,scanTime).
          SET altitudeAt TO localBody:ALTITUDEOF(pos) - localBody:GEOPOSITIONOF(pos):TERRAINHEIGHT.
          SET stepVal TO stepVal / 2.
        }
      }
      IF maxScanTime < scanTime {
        SET scanTime TO posTime.
        SET stepVal TO stepVal / 2.
      }
    }
	set ImpactTime to (scanTime - TIME:SECONDS).
	print  (scanTime - TIME:SECONDS).
  } ELSE {
   print -1.
  }
}


////
////
////


function PID_init {
  parameter
    Kp,      // gain of position
    Ki,      // gain of integral
    Kd,      // gain of derivative
    cMin,  // the bottom limit of the control range (to protect against integral windup)
    cMax.  // the the upper limit of the control range (to protect against integral windup)

  local SeekP is 0. // desired value for P (will get set later).
  local P is 0.     // phenomenon P being affected.
  local I is 0.     // crude approximation of Integral of P.
  local D is 0.     // crude approximation of Derivative of P.
  local oldT is -1. // (old time) start value flags the fact that it hasn't been calculated
  local oldInput is 0. // previous return value of PID controller.

  // Because we don't have proper user structures in kOS (yet?)
  // I'll store the PID tracking values in a list like so:
  //
  local PID_array is list(Kp, Ki, Kd, cMin, cMax, SeekP, P, I, D, oldT, oldInput).

  return PID_array.
}.


////
////
////


function PID_seek {
  parameter
    PID_array, // array built with PID_init.
    seekVal,   // value we want.
    curVal.    // value we currently have.

  // Using LIST() as a poor-man's struct.

  local Kp   is PID_array[0].
  local Ki   is PID_array[1].
  local Kd   is PID_array[2].
  local cMin is PID_array[3].
  local cMax is PID_array[4].
  local oldS   is PID_array[5].
  local oldP   is PID_array[6].
  local oldI   is PID_array[7].
  local oldD   is PID_array[8].
  local oldT   is PID_array[9]. // Old Time
  local oldInput is PID_array[10]. // prev return value, just in case we have to do nothing and return it again.

  local P is seekVal - curVal.
  local D is oldD. // default if we do no work this time.
  local I is oldI. // default if we do no work this time.
  local newInput is oldInput. // default if we do no work this time.

  local t is time:seconds.
  local dT is t - oldT.

  if oldT < 0 {
    // I have never been called yet - so don't trust any
    // of the settings yet.
  } else {
    if dT > 0 { // Do nothing if no physics tick has passed from prev call to now.
     set D to (P - oldP)/dT. // crude fake derivative of P
     local onlyPD is Kp*P + Kd*D.
     if (oldI > 0 or onlyPD > cMin) and (oldI < 0 or onlyPD < cMax) { // only do the I turm when within the control range
      set I to oldI + P*dT. // crude fake integral of P
     }.
     set newInput to onlyPD + Ki*I.
    }.
  }.

  set newInput to max(cMin,min(cMax,newInput)).

  // remember old values for next time.
  set PID_array[5] to seekVal.
  set PID_array[6] to P.
  set PID_array[7] to I.
  set PID_array[8] to D.
  set PID_array[9] to t.
  set PID_array[10] to newInput.

  return newInput.
}.


////
////
////


Function NoAtmosLanding{
Impact_eta(Time:seconds).
visviva(500).
tcalc(vxx).

set suicideburnstart to (ImpactTime - Tmax + TIME:SECONDS).
print "burn in " + ROUND(ImpactTime - Tmax).
WARPTO(ImpactTime - Tmax + TIME:SECONDS - 30).
LOCK STEERING TO RETROGRADE.
WAIT UNTIL TIME:SECONDS >= suicideburnstart - 30.
print "30 seconds till suicide burn.".
WAIT UNTIL TIME:SECONDS >= suicideburnstart.
LOCK THROTTLE TO 1.
WAIT UNTIL SHIP:VERTICALSPEED > -20.
lock throttle to 0.2.
WAIT UNTIL SHIP:GROUNDSPEED > -1 AND SHIP:GROUNDSPEED < 1.
lock throttle to 0.
unlock steering.
LOCK STEERING TO HEADING(90, 90).

set hoverPID to PID_init( 0.05, 0.01, 0.1, 0, 1 ). // Kp, Ki, Kd, min, max control  range vals.
SET pidThrottle TO 0.
LOCK THROTTLE TO pidThrottle.

SET Seekalt TO -20.

WHEN ALT:RADAR < 100 THEN {
  SET seekalt TO -5.
}

WHEN ALT:RADAR < 20 THEN {
  SET seekalt TO -2.
}

UNTIL SHIP:STATUS = "Landed" {
  SET pidThrottle TO PID_seek(hoverPID, seekalt, SHIP:VERTICALSPEED).
  WAIT 0.001.
}

SET pidThrottle TO 0.
UNLOCK STEERING.
}

////
////
////
