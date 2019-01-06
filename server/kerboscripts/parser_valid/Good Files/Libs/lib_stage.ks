Function StageCheck {

set PrevThrust to MaxThrust.

when MaxThrust < (PrevThrust - 10) then {
      set CurrentThrottle to Throttle.
      lock Throttle to 0.
      wait 1.
	    stage.
	    wait 1.
      lock Throttle to CurrentThrottle.
      set PrevThrust to MaxThrust.
	    preserve.
      }

when MaxThrust = 0 then {
    stage.
    preserve.
      }
}

Function EndStage {
  Parameter EndStage.

  until stage:number = EndStage {
    wait 2.
    stage.
  }

}

Function LaunchStage {
  until ship:availablethrust > 0 {
      wait 1.
      stage.
    }
}
