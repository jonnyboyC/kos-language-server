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
	print  (scanTime - TIME:SECONDS).
  } ELSE {
   print -1.
  }
}

impact_eta(TIME:SECONDS).