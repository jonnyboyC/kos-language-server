
IF ship:body = kerbin AND alt:radar < 500 {
	set runmode to 0.
	set runmodevar1 to 999. // circularization or not
	set runmodevar2 to 999. // desired orbit or target? body -> var2=0	ship -> var2=1.
}

log "" to runmode.ks.
run runmode.ks.
print "current runmode: " + runmode.

log "" to runmodevar1.ks.
run runmodevar1.ks.
print "current runmode var 1: " + runmodevar1.

log "" to runmodevar2.ks.
run runmodevar2.ks.
print "current runmode var 2: " + runmodevar2.

function set_runmode {    // set_runmode(1)
  parameter runmodem.
	print "Runmode set to " + runmodem.
  log "" to runmode.ks.
	deletepath(runmode.ks).
  log "set runmode to " + runmodem + "." to runmode.ks.
  run runmode.ks.
  set runmode to runmodem.
  }

function set_runmodevar1 {
  parameter runmodevar1x.
	print "Runmodevar1 set to " + runmodevar1x.
  log "" to runmodevar1.ks.
	delete runmodevar1.ks.
  log "set runmodevar1 to " + runmodevar1x + "." to runmodevar1.ks.
  run runmodevar1.ks.
  set runmodevar1 to runmodevar1x.
}

function set_runmodevar2 {
  parameter runmodevar2.
	print "Runmodevar2 set to " + runmodevar2.
  log "" to runmodevar2.ks.
	delete runmodevar2.ks.
  log "set runmodevar2 to " + runmodevar2 + "." to runmodevar2.ks.
  run runmodevar2.ks.
  set runmodevar2 to runmodevar2x.
}
