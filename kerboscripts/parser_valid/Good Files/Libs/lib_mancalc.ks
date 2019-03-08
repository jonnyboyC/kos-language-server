Function ManDvCalc {

  Parameter StartRadius.
  Parameter EndSMA.

  set GM to body:mu.
  set CurAlt to body:radius + StartRadius.
  set Vsquared to (GM*((2/CurAlt)-(1/ship:orbit:semimajoraxis))).
  set Velo to SQRT(Vsquared).

  set V1squared to (GM*((2/Curalt)-(1/EndSMA))).
  set Velo1 to SQRT(V1squared).

  set DvNeededPro to Velo1-Velo.

  if DvNeededPro < 0 {
    set NegPro to true.
  } else {
    set NegPro to false.
  }

  set DvNeededPro to ABS(DvNeededPro).

  DvTotGetter().

}

///
///
///

Function TimeTillManeuverBurn {

  Parameter StartTime.
  Parameter DvNeededRad is 0.
  Parameter DvNeededNor is 0.
  Parameter DvNeededPro is 0.
  Parameter ThrustLimit is 100.

  TankNumberGetter().
  TagParameterSetter(MaxNumber).

  set nd to NODE(time:seconds, DvNeededRad, DvNeededNor, DvNeededPro).
  add nd.
  set DvNeeded to nd:deltav:mag.

  ISPTotalGetter().
  set A0 TO (Maxthrust/Mass).
  SET Ve TO ISPTotal*9.80665.
  SET FinalMass TO (mass*constant():e^(-1*DvNeeded/Ve)).
  SET A1 TO (Maxthrust/FinalMass).
  SET T TO (DvNeeded/((A0+A1)/2)).
  SET T TO T * (100/ThrustLimit).

  if NegPro = true {
    set DvNeededPro to DvNeededPro*-1.
  }

  set StartT to (time:seconds + StartTime - T/2).

  remove nd.

  set nd to NODE(StartT, DvNeededRad, DvNeededNor, DvNeededPro).
  add nd.

  set DvPostBurn to DvTot-DvNeeded.

  if DvPostBurn < 0 {

    print "error!".
  }

}

///
///
///

Function PerformBurn {

  parameter cutoffdv is 0.1.

  set tset to 0.
  lock throttle to tset.

  set done to False.

  set dv0 to nd:deltav.
  until done
  {
      set max_acc to ship:maxthrust/ship:mass.

      set tset to min(nd:deltav:mag/max_acc, 1).

      if vdot(dv0, nd:deltav) < 0
      {
          print "End burn, remain dv " + round(nd:deltav:mag,1) + "m/s, vdot: " + round(vdot(dv0, nd:deltav),1).
          lock throttle to 0.
          break.
      }


      if nd:deltav:mag < cutoffdv
      {
          print "Finalizing burn, remain dv " + round(nd:deltav:mag,1) + "m/s, vdot: " + round(vdot(dv0, nd:deltav),1).
          wait until vdot(dv0, nd:deltav) < 0.5.

          lock throttle to 0.
          print "End burn, remain dv " + round(nd:deltav:mag,1) + "m/s, vdot: " + round(vdot(dv0, nd:deltav),1).
          set done to True.
      }
  }
  unlock steering.
  unlock throttle.
}
