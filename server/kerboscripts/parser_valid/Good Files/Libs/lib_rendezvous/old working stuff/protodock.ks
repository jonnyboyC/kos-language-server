clearscreen.
run rend_functions.
print "type in other terminal: run protodock1.".

wait until not ship:messages:empty.
  set received to ship:messages:pop.
  if received:content = "Command 1" {
    wait 0.
  }
print "received".

wait 1.
rcs on.
wait 1.

approach_port(targetPort, dockingPort, 20, 2).
approach_port(targetPort, dockingPort, 10, 1).
approach_port(targetPort, dockingPort, 0, 0.5).

translate(v(0,0,0)).
rcs off.
sas on.
