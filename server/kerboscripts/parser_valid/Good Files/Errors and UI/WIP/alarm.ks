//Parameter Targetheight.
set targetheight to 80000.
set runmode to 0.
set oldmass to ship:mass.
set startheight to alt:radar.
Set errortreshold to 5.
clearscreen.

  ////////////////
 // functions  //
////////////////


function set_runmode{
  parameter runmodex.
  print runmodex at(30,2).
  set runmode to runmodex.
 }

function alarm {
  set alarmstep to 0.
  parameter ala1, ala2, ala3.
  set al1 to ala1.
  set al2 to ala2.
  set al3 to ala3.

  until alarmstep = 4 {
  print "                                                      " at(0, 4).
  wait 0.5.
  print "                    [ 000 ALARM ]                     " at(0, 4).
  print al1 at(22, 4).
  print al2 at(23, 4).
  print al3 at(24, 4).
  wait 0.5.
  set alarmstep to alarmstep +1.
  }
  print "                    [ 000 ALARM ]                     " at(0, 4).
 }

FUNCTION ISH{
  PARAMETER a.
  PARAMETER b.
  PARAMETER ishyness.

  RETURN a-ishyness < b AND a+ishyness > b.
 }

log "" to newerror.ks.
copypath("1:/newerror.ks", "0:/WIP").
deletepath(newerror).
log "" to criticalerror.ks.
copypath("1:/criticalerror.ks", "0:/WIP").
deletepath(criticalerror).


//

Until false {


print "                  [ Run mode: 000 ]                   " at(0, 2).
print "======================================================" at(0, 3).
print "                    [ 000 ALARM ]                     " at(0, 4).


  copypath("0:/WIP/newerror.ks", "")
  Run newerror.ks.
  deletepath(newerror). // makes room for next error report
  copypath("0:/WIP/criticalerror.ks", "").
  Run criticalerror.ks. // makes sure critical errors dont get overriden by less important errors
  deletepath(criticalerror).

// runmode 000
  if runmode = 000 {
    print "                    [ 000 ALARM ]                     " at(0, 4).
    print "                                                      " at (0,6).
   }

// runmode 999
  if runmode = 999 {
    set_runmode(999).
    print "                    [ 000 ALARM ]                     " at(0, 4).
    print al1 at(22, 4).
    print al2 at(23, 4).
    print al3 at(24, 4).
    print "             toggle Action Group 9 to restart.        " at (0,6).
    set scaramucci to 0.
    until scaramucci = 53{
      on ag9 {
        set scaramucci to 53.
      }
    }
    set_runmode(000).
    }

// runmode 998
  if runmode = 998 {
    lock throttle to 0.
    ag9 on.
    ag8 on. // LES
    wait until alt:radar < 20000.
    until stage:number = 1 {
      stage.
      wait 0.
    }
   }

// 901 alarm
If body:atm:exists = true {
  if Targetheight * (1 - errortreshold/100) < body:atm:HEIGHT {
    alarm(9,0,1).
    set_runmode(999).
  }

// 902 alarm
} Else if Targetheight < 0 {
 alarm(9,0,2).
 set_runmode(999).
 }

// 903 alarm
If Targetheight > body:SOIradius {
  print alarm(9,0,3).
  set_runmode(999).
 }

// 001 alarm
for p in ship:partsnamed("launchClamp1") {
  if p:stage <> stage:number - 1 {
    AG9 on.// toggle power other terminals
    alarm (0,0,1).
    set_runmode(999).
  }
 }

// 002 alarm
if ship:status = "PRELAUNCH" {
  wait 0.5.
  if ship:status <> "PRELAUNCH" {
    WAIT 0.
  } ELSE {
  list engines in elist.
  set eee to 0.
  set alarmgo to 2.
  until elist:length = eee{
    for e in elist{
      if e:stage = stage:number -1 {
        set alarmgo to 3.
        }
        set eee to eee + 1.
      }
    }
  if alarmgo = 2 {
    AG9 on.// toggle power other terminals
    alarm (0,0,2).
    set_runmode(999).
  }
 }
 }

// 201 alarm
if ship:ELECTRICCHARGE < 50 {
  alarm(2,0,1).
 }

// 101 alarm
if oldmass > ship:drymass + 10 {
  set oldmass to ship:drymass.
  if juststaged = false {
  alarm(1,0,1).
  set_runmode(998).
  }
 }

// 102 alarm
if ISH(alt:radar, startheight, 10)  {
  wait 0. }
  Else if ship:verticalspeed < 0 {
      set oldheight to alt:radar.
      alarm(1,0,2).
      set_runmode(998).
    }

// 906 alarm
if abort {
  alarm(9,0,6).
  set_runmode(998).
 }


}
