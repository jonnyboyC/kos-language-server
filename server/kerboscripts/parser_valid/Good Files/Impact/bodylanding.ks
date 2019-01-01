//body landing script!
// https://www.youtube.com/watch?annotation_id=annotation_4196442851&feature=iv&src_vid=cf9Jh44kL20&v=A-wAiFFSY6o

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



///
///
///

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

// calculate current time to slow down

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
print "Burntime: " + ROUND(TMAX) + " seconds.".
}
//
//

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




