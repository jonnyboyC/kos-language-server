SET pScale TO 0.002.

FUNCTION P_LOOP {
  PARAMETER targget.

  RETURN (targget - ALTITUDE) * pScale.
}

LOCK STEERING TO HEADING(90, 90).
STAGE.

// Test our proportional function
SET autoThrottle TO 0.
LOCK THROTTLE TO autoThrottle.

SWITCH TO 0.
SET startTime TO TIME:SECONDS.

UNTIL STAGE:LIQUIDFUEL < 10 {
  SET autoThrottlex TO P_LOOP(500).
  SET autoThrottle TO MAX(0, MIN(autoThrottlex, 1)).
  WAIT 0.001.
  LOG (TIME:SECONDS - startTime) + "," + ALTITUDE + "," + autoThrottle TO "testflight2.csv".
}

// Recover the vessel
LOCK THROTTLE TO 0.
STAGE.
SWITCH TO 1.