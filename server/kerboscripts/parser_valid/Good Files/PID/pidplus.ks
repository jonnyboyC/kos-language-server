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

//////
//////
//////
//////
//////

set seekAlt to 25.

on ag1 { set seekAlt to seekAlt -10. preserve. }.
on ag2 { set seekAlt to seekAlt - 1. preserve. }.
on ag3 { set seekAlt to seekAlt + 1. preserve. }.
on ag4 { set seekAlt to seekAlt +10. preserve. }.

set ship:control:pilotmainthrottle to 0.

// hit "stage" until there's an active engine:
until ship:availablethrust > 0 {
  wait 0.5.
  stage.
}.

// thOffset is how far off from midThrottle to be.
// It's the value I'll be letting the PID controller
// adjust for me.
set myTh to 0.

lock throttle to myTh.

set hoverPID to PID_init( 0.05, 0.01, 0.1, 0, 1 ). // Kp, Ki, Kd, min, max control  range vals.

gear on.  gear off. // on then off because of the weird KSP 'have to hit g twice' bug.

until gear {
  set myTh to PID_seek( hoverPID, seekAlt, alt:radar ).
  wait 0.01.
}.

set ship:control:pilotmainthrottle to throttle.
print "------------------------------".
print "Releasing control back to you.".
print "------------------------------".






