// final touches

function translate {

  parameter vector.
  if vector:mag>1 {
    set vector to vector:normalized.
  }

  set ship:control:fore       to vector * ship:facing:forevector.
  set ship:control:starboard  to vector * ship:facing:starvector.
  set ship:control:top        to vector * ship:facing:topvector.

}


FUNCTION kill_rel_vel {
  parameter TargetThingy.

  lock relvel to ship:velocity:orbit - TargetThingy:velocity:orbit.

  until relvel:mag < 0.5 {
    translate(-1*relvel).
  }
  translate(v(0,0,0)).
}

FUNCTION rcs_throttle {
  parameter throttlevar.

  set rcslist to ship:partsnamed("RCSBlock").
  for rcsunit in rcslist{
    rcsunit:getmodule("moduleRCSFX"):setfield("thrust limiter", throttlevar).
  }

}

//
lock relvel to ship:velocity:orbit - TargetThingy:velocity:orbit.
lock RelVelx to (ship:velocity:orbit - TargetThingy:velocity:orbit):mag.
lock provec to ship:velocity:orbit - TargetThingy:velocity:orbit.
lock retvec to -(ship:velocity:orbit - TargetThingy:velocity:orbit).
lock antvec to ship:position - TargetThingy:position.
lock tarvec to -(ship:position - TargetThingy:position).
// warping one orbit

print "running finsub".

sas off.
lock steering to retvec.
wait until vang(ship:facing:vector, retvec) < 2.
wait 5.

set donex to false.

set throtcon to 0.
lock throttle to throtcon.

until donex = true {
  set throtcon to (min((ABS(RelVelx)/(Maxthrust/mass)), 1)).
  print "Rel vel " + relvelx.

  if RelVelx < 50 {
  set throtcon to throtcon.
  }


  if RelVelx < 10 {
    print "relvel " + relvelx.
    list engines in englist.
    for eng in englist {
      set eng:thrustlimit to 10.
    }
    }

  if RelVelx < 1.3 {

    lock throttle to 0.
    rcs_throttle(25).
    print "relvel " + relvelx.
    rcs on.
    kill_rel_vel(TargetThingy).
    lock steering to -relvel. // relvel became a vector after kill_rel_vel
    rcs_throttle(5).

    set relvar to 1.
    until RelVelx < 0.05{
      set ship:control:fore to 1.
      print relvelx.

      set startrelvel to relvelx.
      wait 0.02.
      set endrelvel to relvelx.

      if startrelvel - endrelvel < 0 {
        set relvar to relvar+0.5.
        print "relvar: " + relvar.
      }

      rcs_throttle(5+relvar).
    }
    set ship:control:fore to 0.
    rcs off.
    rcs_throttle(100).
    set donex to true.


  }

}


// final approach

print "final approach".

set throtcon to 0.
lock throttle to throtcon.

lock steering to tarvec.
wait until vang(ship:facing:vector, tarvec) < 2.
wait 5.

until RelVelx > 1 {
  set throtcon to (min(((5-ABS(RelVelx))/(Maxthrust/mass)), 1)).
  list engines in englist.
  for eng in englist {
    set eng:thrustlimit to 25.
  }
}
lock throttle to 0.

lock steering to retvec.
wait until vang(ship:facing:vector, retvec) < 2.
wait 5.

set readyx to false.

until readyx = true {
wait 0.
set olddis to TargetThingy:distance.
wait 10.
set newdis to TargetThingy:distance.
print TargetThingy:distance.

if newdis > olddis {
  set readyx to true.
}

if TargetThingy:distance < 25 {
  set readyx to true.
}

}

// ... slow down
rcs on.

set relvar to 1.
until RelVelx < 0.05{
  set ship:control:fore to 1.
  print relvelx.

  set startrelvel to relvelx.
  wait 0.02.
  set endrelvel to relvelx.

  if startrelvel - endrelvel < 0 {
    set relvar to relvar+0.5.
    print "relvar: " + relvar.
  }

  rcs_throttle(5+relvar).
}
rcs off.
unlock steering.
