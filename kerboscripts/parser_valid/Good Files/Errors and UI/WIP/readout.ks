// unknown stuff
set currentdv to 0.
set totalDv to 0.
set targetheight to 80000.
set runmode1 to 0.
set runmode2 to 0.
set runmode3 to 0.
clearscreen.

SET TERMINAL:WIDTH to 54.
SET TERMINAL:HEIGHT to 15.

Function alarm {
  parameter nxxx, mxxx, lxxx.
  wait 0.
}
// the newrunmode files contains "alarm(x,y,z)" so an empty function will prevent a crash

log "" to newerror.ks.
log "" to criticalerror.ks.

until false {

  log "" to newerror.ks.
  log "" to criticalerror.ks.


  print "                  [ Run mode: 000 ]                   " at(0, 2).
  print "======================================================" at(0, 3).
  print "Apo                      |Per                         " at(0, 4).
  print "Eta                      |Eta                         " at(0, 5).
  print "-------------------------+----------------------------" at(0, 6).
  print "Alt                      |Tar                         " at(0, 7).
  print "-------------------------+----------------------------" at(0, 8).
  print "Dvc                      |Dvt                         " at(0, 9).
  print "-------------------------+----------------------------" at(0, 10).
  print "Ver                      |Hor                         " at(0, 11).
  print "======================================================" at(0, 12).

  print ROUND(ship:apoapsis)      at (5, 4).
  print ROUND(eta:apoapsis)       at (5, 5).
  print ROUND(ship:periapsis)     at (31, 4).
  print ROUND(eta:periapsis)      at (31, 5).
  print ROUND(ship:altitude)      at (5,7).
  print ROUND(Targetheight)       at (31, 7).
  print ROUND(currentDv)          at (5, 9).
  print ROUND(totalDv)            at (31, 9).
  print ROUND(ship:verticalspeed) at (5, 11).
  print ROUND(ship:groundspeed)   at (31, 11).


run newerror.ks.
deletepath(newerrror).
run criticalerror.ks.
deletepath(criticalerror).
//  newrunmode contains "set runmode1 to x etc etc"
print runmode1 at (30, 2).
print runmode2 at (31, 2).
print runmode3 at (32, 2).
wait 0.5.

if ship:maxthrust = 0 {
  set currentdv to 0.
  set totalDv to 0.
} Else {
SET eIsp TO 0.
List engines IN my_engines.
For eng In my_engines{
  SET eIsp TO eISP + ((eng:maxthrust/maxthrust)*eng:isp).
}

set surfgrav to (constant:g * body:mass)/body:radius^2.
SET Ve TO eIsp*surfgrav.
set liq to (stage:liquidfuel*5).
set oxi to (stage:oxidizer*5).
Set currentdv to Ve * ln((ship:mass*1000)/(ship:mass*1000 - liq - oxi)).

Set totalDv to Ve * ln(ship:mass/ship:drymass).
}

}
