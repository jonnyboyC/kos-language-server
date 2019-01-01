@lazyglobal off.

{

global T_Docking is lexicon(
  "Dock", Dock@
  ).

Function PortGetter {
  Parameter NameOfVessel is ship.
  Parameter PrePickedPort is "none".

  if PrePickedPort = "none" {

    local portlist is list().
    for port in NameOfVessel:partsdubbedpattern("dock"){
      portlist:add(port).
    }

    local PortNumber is 0.
    until false {
      if portlist[PortNumber]:state = "ready" {
        return portlist[PortNumber].
      } else {
        set PortNumber to PortNumber + 1.
      }
    }
  } else {
    return PrePickedPort.
  }
}

Function Translate {
  Parameter SomeVector.
  if SomeVector:mag > 1 {
    set SomeVector to SomeVector:normalized.
  }

  set ship:control:starboard to SomeVector * ship:facing:starvector.
  set ship:control:fore      to SomeVector * ship:facing:forevector.
  set ship:control:top       to SomeVector * ship:facing:topvector.
}

Function KillRelVelRCS {
  Parameter TargetDockingPort.

  local lock RelativeVelocity to ship:velocity:orbit - TargetDockingPort:ship:velocity:orbit.
  until RelativeVelocity:mag < 0.1 {
    Translate(-1*RelativeVelocity).
  }
  Translate(V(0,0,0)).
}

Function ApproachDockingPort {
  Parameter ShipDockingPort.
  Parameter TargetDockingPort.
  Parameter Distance.
  Parameter Speed.
  Parameter ErrorAllowed is 0.1.

  ShipDockingPort:controlfrom.

  local Lock DistanceInFrontOfPort to TargetDockingPort:portfacing:vector:normalized * Distance.
  local Lock ShipToDIFOP to TargetDockingPort:nodeposition - ShipDockingPort:nodeposition + DistanceInFrontOfPort.
  local Lock RelativeVelocity to ship:velocity:orbit - TargetDockingPort:ship:velocity:orbit.

  clearvecdraws().
  local vecdDIFOP is vecdraw(TargetDockingPort:position, DistanceInFrontOfPort, RGB(1,0,0), "DistanceInFrontOfPort", 1.0, false, 0.2).
  local vecdSTDIFOP is vecdraw(v(0,0,0), ShipToDIFOP, RGB(0,1,0), "ShipToDIFOP", 1.0, false, 0.2).
  set vecdDIFOP:startupdater to {return DistanceInFrontOfPort.}.
  set vecdSTDIFOP:startupdater to {return ShipToDIFOP.}.

  until ShipDockingPort:state <> "ready" {
    Translate((ShipToDIFOP:normalized*Speed) - RelativeVelocity).
        local DistanceVector is (TargetDockingPort:nodeposition - ShipDockingPort:nodeposition).
    if vang(ShipDockingPort:portfacing:vector, DistanceVector) < 2 and abs(Distance - DistanceVector:mag) < ErrorAllowed {
      break.
    }
  }
  Translate(v(0,0,0)).
}

Function EnsureRange {
  Parameter ShipDockingPort.
  Parameter TargetDockingPort.
  Parameter Distance.
  Parameter Speed.

  local Lock RelativePosition to ship:position - TargetDockingPort:position.
  local Lock SafetyBubbleVector to (RelativePosition:normalized*distance) - RelativePosition.
  local Lock RelativeVelocity to ship:velocity:orbit - TargetDockingPort:ship:velocity:orbit.

  local BreakLoop is false.
  until BreakLoop = true {
    Translate((SafetyBubbleVector:normalized*speed) - RelativeVelocity).
    if SafetyBubbleVector:mag < 0.1 {
      set BreakLoop to true.
    }
  }
  Translate(v(0,0,0)).
}

Function SidewaysApproach {
  Parameter ShipDockingPort.
  Parameter TargetDockingPort.
  Parameter Distance.
  Parameter Speed.

  ShipDockingPort:controlfrom.

  local lock SideDirection to TargetDockingPort:ship:facing:starvector.
  if abs(SideDirection*TargetDockingPort:portfacing:vector) = 1 {
    Lock SideDirection to TargetDockingPort:ship:facing:topvector.
  }

  local lock DistanceNextToPort to SideDirection:normalized*Distance.

  if (TargetDockingPort:nodeposition - ShipDockingPort:nodeposition - DistanceNextToPort):mag <
     (TargetDockingPort:nodeposition - ShipDockingPort:nodeposition + DistanceNextToPort):mag {
       Lock DistanceNextToPort to (-1*SideDirection*Distance).
     }

  local lock ShipToDNTP to TargetDockingPort:nodeposition - ShipDockingPort:nodeposition + DistanceNextToPort.
  local lock RelativeVelocity to ship:velocity:orbit - TargetDockingPort:ship:velocity:orbit.

  local vecdDNTP is vecdraw(TargetDockingPort:position, DistanceNextToPort, RGB(1,0,0), "DistanceNextToPort", 1.0, false, 0.2).
  local vecdSTDNTP is vecdraw(v(0,0,0), ShipToDNTP, RGB(0,1,0), "ShipToDNTP", 1.0, false, 0.2).
  set vecdDNTP:startupdater to {return DistanceNextToPort.}.
  set vecdSTDNTP:startupdater to {return ShipToDNTP.}.

  local BreakLoop is false.
  until BreakLoop = true {
    Translate((ShipToDNTP:normalized*Speed) - RelativeVelocity).
    if ShipToDNTP:mag < 0.1 {
      set BreakLoop to true.
    }
  }
  Translate(v(0,0,0)).
}

Function Dock {
  Parameter TargetDestination.

  clearvecdraws().
  local ShipDockingPort is PortGetter(ship, "none").
  local TargetDockingPort is PortGetter(TargetDestination, "none").

  ShipDockingPort:controlfrom.
  SAS off.
  T_Steering["SteeringTarget"](TargetDockingPort:ship).
  RCS on.

  print "Ensuring range 100m".
  EnsureRange(ShipDockingPort, TargetDockingPort, 100, 2).
  print "Killing relative velocity".
  KillRelVelRCS(TargetDockingPort).
  print "Sideways approach 100m".
  SidewaysApproach(ShipDockingPort, TargetDockingPort, 100, 1).
  print "Approach 100m".
  ApproachDockingPort(ShipDockingPort, TargetDockingPort, 100, 1).
  print "Approach 50m".
  ApproachDockingPort(ShipDockingPort, TargetDockingPort, 50, 3).
  print "Approach 20m".
  ApproachDockingPort(ShipDockingPort, TargetDockingPort, 20, 2).
  print "Approach 10m".
  ApproachDockingPort(ShipDockingPort, TargetDockingPort, 10, 1).
  print "Approach 5m".
  ApproachDockingPort(ShipDockingPort, TargetDockingPort, 5, 0.5).
  print "Approach 1m".
  ApproachDockingPort(ShipDockingPort, TargetDockingPort, 1, 0.3, 0.05).
  print "Approach 0m".
  ApproachDockingPort(ShipDockingPort, TargetDockingPort, 0, 0.1).
  print "Docked".
  clearvecdraws().
  RCS off.
}

print "read lib_docking".

}
