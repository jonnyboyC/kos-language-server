
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
  parameter targetport.

  lock relvel to ship:velocity:orbit - targetport:ship:velocity:orbit.

  until relvel:mag < 0.1 {
    translate(-1*relvel).
  }
  translate(v(0,0,0)).
}

FUNCTION approach_port {
  parameter targetport, dockingport, distance, speed.

  dockingport:controlfrom.

  lock distanceoffset to targetport:portfacing:vector * distance.
  lock approachvector to targetport:nodeposition - dockingport:nodeposition + distanceoffset.
  lock relvel to ship:velocity:orbit - targetport:ship:velocity:orbit.
  lock steering to LOOKDIRUP(-targetport:portfacing:vector, targetport:portfacing:upvector).

  until dockingport:state <> "ready" {
    translate((approachvector:normalized*speed) - relvel).
    local distancevector is (targetport:nodeposition - dockingport:nodeposition).
    if vang(dockingport:portfacing:vector, distancevector) < 2 and ABS(distance - distancevector:mag) < 0.1 {
      break.
      }
    wait 0.02.
    }
    translate(v(0,0,0)).
  }


  FUNCTION ensure_range {
    PARAMETER targetPort, dockingPort, distance, speed.

    LOCK relativePosition TO SHIP:POSITION - targetPort:SHIP:POSITION.
    LOCK departVector TO (relativePosition:normalized * distance) - relativePosition.
    LOCK relvel TO SHIP:VELOCITY:ORBIT - targetPort:SHIP:VELOCITY:ORBIT.
    LOCK STEERING TO -1 * targetPort:PORTFACING:VECTOR.

    UNTIL FALSE {
      translate((departVector:normalized * speed) - relvel).
      IF departVector:MAG < 0.1 BREAK.
      WAIT 0.01.
    }

    translate(V(0,0,0)).
  }

  FUNCTION sideswipe_port {
    PARAMETER targetPort, dockingPort, distance, speed.


      dockingPort:CONTROLFROM().

      // Get a direction perpendicular to the docking port
      LOCK sideDirection TO targetPort:SHIP:FACING:STARVECTOR.
      IF abs(sideDirection * targetPort:PORTFACING:VECTOR) = 1 {
        LOCK sideDirection TO targetPort:SHIP:FACING:TOPVECTOR.
      }

      LOCK distanceOffset TO sideDirection * distance.
      // Flip the offset if we're on the other side of the ship
      IF (targetPort:NODEPOSITION - dockingPort:NODEPOSITION + distanceOffset):MAG <
         (targetPort:NODEPOSITION - dockingPort:NODEPOSITION - distanceOffset):MAG {
        LOCK distanceOffset TO (-sideDirection) * distance.
      }

      LOCK approachVector TO targetPort:NODEPOSITION - dockingPort:NODEPOSITION + distanceOffset.
      LOCK relvel TO SHIP:VELOCITY:ORBIT - targetPort:SHIP:VELOCITY:ORBIT.
      LOCK STEERING TO -1 * targetPort:PORTFACING:VECTOR.

    UNTIL FALSE {
      translate((approachVector:normalized * speed) - relvel).
      IF approachVector:MAG < 0.1 BREAK.
      WAIT 0.01.
    }

    translate(V(0,0,0)).
  }
