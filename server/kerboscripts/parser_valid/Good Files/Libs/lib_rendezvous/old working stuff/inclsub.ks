KillRelVel(TargetThingy, 30).
FinalApproach(500).

rcs on.
sas off.

set dockingport to ship:partstagged("port A")[0].
set targetport  to TargetThingy:partstagged("port B")[0].

print "killing relative velocity...".
kill_rel_vel(targetPort).
print "approaching...".
approach_port(targetPort, dockingPort, 100, 5).
approach_port(targetPort, dockingPort, 50, 3).
approach_port(targetPort, dockingPort, 40, 1).
approach_port(targetPort, dockingPort, 35, 0.4).

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
