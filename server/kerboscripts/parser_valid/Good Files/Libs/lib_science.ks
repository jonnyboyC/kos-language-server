Function ScienceCollect{

parameter KeepData is false.
set ModuleList to List().

for m in ship:modulesnamed("DMModuleScienceAnimate") {
  if m:inoperable = false {
    m:deploy.
    wait until m:hasdata.
    print "Science collected!".
    wait 1.
    m:toggle.
    if m:inoperable = true {
      if KeepData = false {
        m:dump.
      }
    }
    if m:data:transmitvalue < 0.1 {
      m:dump.
    }
    ModuleList:Add(m).
  }
}

for m in ship:modulesnamed("ModuleScienceExperiment") {
  if m:inoperable = false {
    m:deploy.
    wait until m:hasdata.
    print "Science collected!".
    if m:inoperable = true {
      if KeepData = false {
        m:dump.
      }
    }
    if m:data:transmitvalue < 0.1 {
      m:dump.
    }
    ModuleList:Add(m).
  }
}

}

Function TransmitData {

For m in ModuleList {
  m:transmit.
}

ModuleList:clear.  

}
