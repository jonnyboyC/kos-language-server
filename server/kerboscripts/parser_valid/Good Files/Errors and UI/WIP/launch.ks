Parameter TargetThingy.
set oldTargetThingy to -1.

  ///////////////
 // FUNCTIONS //
///////////////

FUNCTION ISH{
  PARAMETER a.
  PARAMETER b.
  PARAMETER ishyness.

  RETURN a-ishyness < b AND a+ishyness > b.
 }

FUNCTION countdownliftoff{
  set startheight to alt:radar.
  print "Preparing for launch...".
  wait 5.
  clearscreen.
  print "initiating countdown procedure...".
  print "5...".
  wait 1.
  print "4...".
  wait 1.
  print "3...".
  wait 1.
  print "2...".
  wait 1.
  print "1...".
  wait 1.
  print "0...".

  until ship:availablethrust > 0 {
    wait 0.5.
    wait 0.
    stage.
  }
   print "ignition!".
   wait until alt:radar > startheight.
   print "lift off, we have a lift off!".

   }

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

FUNCTION Circuralization1 {
  parameter direction, trot.

  lock steering to heading(direction, 0).
  wait 5.

  IF eta:apoapsis > 300 {
  	set kuniverse:timewarp:warp to 3.
  	}

  Wait until eta:apoapsis <= 180.
  set kuniverse:timewarp:warp to 0.

  wait until eta:apoapsis < 20.
  Lock throttle to Trot.
  set circvar to 3.
 }

FUNCTION Circuralization2 {
  set oldap to APOAPSIS.
  wait until eta:apoapsis>50 OR Periapsis>oldap.
  lock throttle to 0.
  if eta:apoapsis>600{
  	lock throttle to 1.
  	wait until periapsis>oldap.
  	lock throttle to 0.
  }

  If (APOAPSIS-PERIAPSIS)>5000{
  	set circvar to 4.
  	}ELSE{
      set circvar to 5.
  		}
 }

  ///////////
 // LISTS //
///////////

// ascent profile for Kerbin
if ship:body:name = "Kerbin" {
 set ASCENT_PROFILE to list (
  0,		  80,		1,
  2500,	  80,		0.75,
  10000,	75,		0.75,
  15000,	70,		0.75,
  20000,	65,		0.75,
  25000,	60,		0.75,
  32000,	50,		0.75,
  45000,	35,		0.55,
  50000,	25,		0.35,
  60000,	10,		0.10,
  70000,	0,		0.05
  ).
 }

// ascent profile for atmosphereless bodies
if body:atm:exists = false {
  set ASCENT_PROFILE to list (
    0,     80,  1,
    5000,  65,  0.75,
    7500,  35,  0.5,
    9000,  0,   0.1
    )
 }

  //////////////
 // RUNMODES //
//////////////

// runmode 0 [prelaunch]
If runmode = 0 {
  if TargetThingy:istype("vessel") {
    set TargetThingy to vessel(TargetThingy).
  } else if TargetThingy:istype("body") {
    set TargetThingy to body(TargetThingy).
  }
  countdownliftoff().
  set circvar to 2.
  set_runmode(1).
 }

//runmode 1 [in flight, sub orbital]
if runmode = 1 {
  EXECUTE_ASCENT_PROFILE(90, ASCENT_PROFILE).
  set_runmode(2).
 }

// runmode 2 [in space, setting panels on]
if runmode = 2 {
  if body:atm:exists = true {
    wait until altitude > body:atm:height.
    lock throttle to 0.
    panels on.
    set_runmode(3).
  } Else {
    wait until altitude > 9000.
    lock throttle to 0.
    panels on.
    set_runmode(3).
  }
 }

// runmode 3 [in space, circularizing]
if runmode = 3 {
  Until ISH(apoapsis, periapsis, 5000){
    if circvar = 2 { // circvar set to 2 in runmode 0.
      Circuralization1(90, 1). // waiting till right time
    }
    if circvar = 3 {
      Circuralization2(). // firing up at the right time
    }
    if circvar = 4 {
      Circuralization1(90, 0.2)
    }
    if circvar = 5 {
      wait 0.
    }
  }
  set_runmode(4).
 }

// runmode 4 [circularization complete, checking which runmode to choose ]
if runmode = 4 {

  if TargetThingy:istype("Vessel"){
    set_runmode(5). // rendezvous runmode
  } Else if TargetThingy:istype("Body") {
    set_runmode(6). // body intercepter runmode
  } Else {
    set_runmode(7). // target orbit
  }

 }

// runmode 5 [ rendezvous runmode ]
if runmode = 5 {
  if ship:body <> TargetThingy:Body { // if rendezvous vessel <> current body change TargetThingy and runmode.
    set oldTargetThingy to TargetThingy.
    set TargetThingy to TargetThingy:Body.
    set_runmode(6).
 } Else {
     ACTUAL RENDEZVOUS SCRIPT
     }
 }

// runmode 6 [ body intercepting runmode ]
If runmode = 6 {
 some body script
 }

// runmode 7 [ target orbit do-er ]
if runmode = 7 {
  targetorbit script
 }
