
until thetachange < 0.009 {
  InclinationMatcher(TargetThingy).
}


if ship:apoapsis < TargetThingy:periapsis {
  Circularizer(0.0009, apoapsis).
} else {
  Circularizer(0.0009, periapsis).
}

run rendmain.
