Function PartMassListMaker {
  set PartMassList to list().
  set dvlist to list().
  set PreviousMasses to 0.
  set DvTot to 0.
}

Function TankNumberGetter {
  set MaxNumber to 0.
  for p in ship:partstaggedpattern("^tank") {
    set TankNumber to p:tag:remove(0,4):tonumber.
    if TankNumber > MaxNumber {
      set MaxNumber to TankNumber.
    }
  }
}

Function TagParameterSetter{
  parameter TagNumber.

  set TankTagNumber      to ship:partstagged("tank"+TagNumber).
  set EngineTagNumber    to ship:partstagged("eng"+TagNumber).
  set OtherTagNumber     to ship:partstagged("oth"+TagNumber).
}

Function FuelMassGetter {

  set FuelMass to 0.

  for part in TankTagNumber {
    for SomeResource in part:resources {
      set FuelMass to FuelMass + SomeResource:amount * SomeResource:density.

    }
  }

  //print "Fuel mass: " + FuelMass.

}

Function PartMassGetter {
  set PartMass to 0.

  for SomePart in TankTagNumber {
    set PartMass to PartMass + SomePart:mass.
  }

  for SomePart in EngineTagNumber {
    set PartMass to PartMass + SomePart:mass.
  }

  for SomePart in OtherTagNumber {
    set PartMass to PartMass + SomePart:mass.
  }

  //print "Part mass: " + PartMass.

}

Function ISPTotalGetter {

  set ThrustSum to 0.
  set ThrustISP to 0.

  lock throttle to 0.


  for engine in EngineTagNumber {

    if engine:availablethrust = 0 {
      engine:getmodule("ModuleEnginesFX"):doaction("toggle engine", true).
      set TrueOrFalse to True.
    } else {
      set TrueOrFalse to False.
    }

    if engine:availablethrust > 0 {
      set ThrustSum to ThrustSum + engine:maxthrust.
      set ThrustISP to ThrustISP + (engine:maxthrust/engine:ispat(0)).
    }
    if TrueOrFalse = True {
      engine:getmodule("ModuleEnginesFX"):doaction("toggle engine", true).
    }
  }

  if ThrustISP > 0 {
    set ISPTotal to ThrustSum/ThrustISP.
  } else {
    set ISPTotal to 0.
  }
  //print "ISPTotal: " + ISPTotal.
}

Function DvGetter {
  //print "TankNumber: " + TankNumber.
  set Ve to 9.8065*ISPTotal.
    set OldSection to TankNumber+1.
    for OldPart in ship:partstaggedpattern(""+OldSection) {
      set PreviousMasses to PreviousMasses + OldPart:mass.
    }
    set Dv to Ve * ln((mass-PreviousMasses)/(mass-FuelMass-PreviousMasses)).
    set DvTot to DvTot + Dv.
  //print "Dv: " + Dv.
  //print "Dv max: " + DvTot.
  dvlist:add(TankNumber).
  dvlist:add(Dv).



}

Function DvstageGetter {
  parameter TankName.

  set TankName to TankName+1.
  set dvlistlength to dvlist:length.
  set tankstuff to (2*TankName)-1.

  set stagedv to dvlist[dvlistlength-tankstuff].
}

Function DvTotGetter {

  PartMassListMaker().
  TankNumberGetter().

  TagParameterSetter(MaxNumber).

  until TankNumber = -1 {
  TagParameterSetter(TankNumber).

  FuelMassGetter().
  PartMassGetter().
  ISPTotalGetter().
  DvGetter().
  set TankNumber to TankNumber -1.
  }

  set localnumber to MaxNumber.
  until localnumber = -1 {
    DvstageGetter(localnumber).
    print "Tank " + localnumber + " dv: " +stagedv.

    set localnumber to localnumber-1.
  }

}
