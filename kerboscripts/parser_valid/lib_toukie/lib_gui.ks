@lazyglobal off.

{

global T_GUI is lexicon(
  "CompleteParameterGUI", CompleteParameterGUI@,
  "StatusCheck", StatusCheck@,
  "CircGUI", CircGUI@
  ).

local gui is gui(400).
local gui1 is gui(300).
local gui2 is gui(300).
local gui3 is gui(350).
local gui4 is gui(300).

local textbox1 is "x".
local textbox2 is "x".
local textbox3 is "x".
local RendText is gui3:addtextfield("enter ship name").
local RendWindows is "x".

local TargetBody is "x".
local TargetPeriapsis is "x".
local TargetInclination is "x".
local ParameterList is list().

local GUIEmptyBodyList is list().

local ErrorBoolean is "x".
local ErrorBoolean1 is "x".
local ErrorMessage1 is "x".
local ErrorMessage2 is "x".
local ErrorMessage001 is "x".
local ErrorMessage101 is "x".
local ErrorMessage102 is "x".
local ErrorMessage103 is "x".
local ErrorMessage104 is "x".
local ErrorMessage201 is "x".
local ErrorMessage202 is "x".
local ErrorMessage203 is "x".

local FinishProcedure is "x".

Function GUISetup1 {

  local label1 is gui:addlabel("<b><size=30>ToukieDatak's GAPAPOV!</size></b>").
  set label1:style:align to "center".
  local label2 is gui:addlabel("<b><size=20>Go Ahead, Pick Any Planet Or Vessel!*</size></b>").
  set label2:style:align to "center".
  set gui:addlabel("<b><size=9>*no refunds if the script doesn't work</size></b>"):style:align to "center".
  gui:addlabel("<size=20>    </size>").
  gui:addlabel("<size=20> Important: set patched conics to >5 </size>").
  gui:addlabel("<size=15>Target destination: </size>").

  if hastarget = true {
    if target:mass > 10^15 {
      set textbox1 to gui:addtextfield(target:name).
    } else {
      set textbox1 to gui:addtextfield(ship:body:name).
    }
  } else {
    set textbox1 to gui:addtextfield(ship:body:name).
  }

  gui:addlabel("<size=15>    </size>").
  gui:addlabel("<size=15>Periapsis at the target destination:</size>").
  set textbox2 to gui:addtextfield("750000").
  gui:addlabel("<size=15>    </size>").
  gui:addlabel("<size=15>Inclination at the target destination:</size>").
  set textbox3 to gui:addtextfield("0").
  gui:addlabel("<size=15>    </size>").
  local RendButton  is gui:addbutton("rendezvous").
  local applybutton is gui:addbutton("apply").

  gui:show().

  set RendButton:onclick  to RendOptions@.
  set applybutton:onclick to CheckOptions@.
}

Function CheckOptions {

  clearscreen.
  gui2:dispose().
  gui1:hide().
  gui3:hide().
  gui4:hide().
  set gui2 to gui(400).
  local label3 is gui2:addlabel("<size=15>Errors:</size>").
  gui2:addlabel("<size=15>    </size>").
  set label3:style:align to "center".

  local ProceedToPeriapsisCheck is BodyNameCheck().
  FalseErrorSetter().
  if ProceedToPeriapsisCheck = true {
    set ErrorMessage1 to PeriapsisCheck().
    set ErrorMessage2 to InclinationCheck().
  } else {
    set ErrorMessage001 to true.
  }

  ErrorMessageShower().

  gui2:show().

  if ErrorMessage1 = false and ErrorMessage2 = false and ErrorMessage001 = false {
    gui1:show().
    gui2:hide().
  }
}

Function RendOptions {

  gui3:dispose().
  set gui3 to gui(350).
  set gui3:addlabel("<b><size=15>Pick a vessel to perform a rendezvous with:</size> </b>"):style:align to "center".
  if hastarget = true {
    local ShipList is list().
    local Continue is false.
    list targets in ShipList.

    for Shp in ShipList {
      if Shp:name = target:name and Shp:typename = "vessel" {
        set RendText to gui3:addtextfield(target:name).
      }
    }
    if RendText:text <> target:name {
      set RendText to gui3:addtextfield("Eagle").
    }

  } else {
    set RendText to gui3:addtextfield("Eagle").
  }
  local RendAp is gui3:addbutton("apply").
  local RendCa is gui3:addbutton("cancel").
  set RendCa:onclick to {gui3:dispose().}.
  set RendAp:onclick to RendApply@.
  gui3:show().

}

Function RendApply {
  gui4:dispose().
  gui1:hide().
  gui2:hide().
  set gui4 to gui(300).
  gui4:show().

  local ShipName is RendText:text.

  local ShipList is list().
  local Continue is false.
  list targets in ShipList.

  for Shp in ShipList {
    if Shp:name = ShipName {
      set Continue to true.
    }
  }

  if Continue = false {
    HUDtext("Enter a valid vessel name", 5, 2, 30, red, true).
    gui4:dispose().
  }

  local RendConf is gui4:addbutton("confirm").
  local RendCanc is gui4:addbutton("cancel").
  set RendConf:onclick to RendOptionsConf@.
  set RendCanc:onclick to {gui4:dispose(). gui3:hide().}.
}

Function RendOptionsConf {
  gui3:dispose().
  gui4:dispose().
  set RendWindows to true.
  set FinishProcedure to true.
}

Function BodyNameCheck {
  local GivenName is textbox1:text.
  set GUIEmptyBodyList to list().
  local BodyList is list().
  list bodies in BodyList.
  For IndividualBody in BodyList {
    if IndividualBody:name = GivenName {
      GUIEmptyBodyList:add(IndividualBody).
    }
  }
  if GUIEmptyBodyList:length = 1 {
    return true.
  } else {
    return false.
  }
}

Function PeriapsisCheck {
 local DataString is (textbox2:text + ".0").
 local StringToNumber is DataString:tonumber(-27).

  if GUIEmptyBodyList[0]:atm:exists {
    if StringToNumber < GUIEmptyBodyList[0]:atm:height {
      set ErrorMessage101 to true.
      set ErrorBoolean to true.
    }
  }

  if StringToNumber <= 0 {
    set ErrorMessage102 to true.
    set ErrorMessage101 to false.
    set ErrorBoolean to true.
  }

  if StringToNumber = -27 {
    set ErrorMessage103 to true.
    set ErrorMessage102 to false.
    set ErrorMessage101 to false.
    set ErrorBoolean to true.
  }

  if StringToNumber > GUIEmptyBodyList[0]:soiradius {
    set ErrorMessage104 to true.
    set ErrorMessage103 to false.
    set ErrorBoolean to true.
  }

  return ErrorBoolean.
}

Function InclinationCheck {
  local DataString is textbox3:text.
  local StringToNumber is DataString:tonumber(-2727).

  if StringToNumber < 0 {
    set ErrorMessage201 to true.
    set ErrorBoolean1 to true.
  }

  if StringToNumber > 360 {
    set ErrorMessage202 to true.
    set ErrorBoolean1 to true.
  }

  if StringToNumber = -2727 {
    set ErrorMessage203 to true.
    set ErrorMessage201 to false.
    set ErrorBoolean1 to true.
  }

  return ErrorBoolean1.
}

Function FalseErrorSetter {
  set ErrorBoolean to 0.
  set ErrorBoolean1 to 0.
  set ErrorMessage1 to 0.
  set ErrorMessage2 to 0.
  set ErrorMessage001 to 0.
  set ErrorMessage101 to 0.
  set ErrorMessage102 to 0.
  set ErrorMessage103 to 0.
  set ErrorMessage104 to 0.
  set ErrorMessage201 to 0.
  set ErrorMessage202 to 0.
  set ErrorMessage203 to 0.

}

/// GUI 1 cancel / confirm buttons
Function GUISetup2 {
  local ConfirmButton is gui1:addbutton("confirm").
  local CancelButton  is gui1:addbutton("cancel").

  set ConfirmButton:onclick to ConfirmOptions@.
  set CancelButton:onclick to CancelOptions@.
}

Function ConfirmOptions {
  gui:hide().
  gui1:hide().
  gui2:hide().
  set FinishProcedure to true.
  wait 1.
}

Function CancelOptions {
  gui1:hide().
  gui2:hide().
  gui2:dispose().
}

// GUI 2 error messages

Function ErrorMessageShower {

  if ErrorMessage001 = true {
    set gui2:addlabel("<size=15>incorrect body name</size>"):style:align to "center".
    gui2:addlabel("<size=15>    </size>").
  }

    if ErrorMessage101 = true {
      set gui2:addlabel("<size=15>periapsis under atmosphere</size>"):style:align to "center".
      gui2:addlabel("<size=15>    </size>").
    }
    if ErrorMessage102 = true {
      set gui2:addlabel("<size=15>periapsis under surface</size>"):style:align to "center".
      gui2:addlabel("<size=15>    </size>").
    }
    if ErrorMessage103 = true {
      set gui2:addlabel("<size=15>periapsis input contains letters, use numbers only</size>"):style:align to "center".
      gui2:addlabel("<size=15>    </size>").
    }
    if ErrorMessage104 = true {
      set gui2:addlabel("<size=15>periapsis too high, outside of SOI</size>"):style:align to "center".
      gui2:addlabel("<size=15>    </size>").
    }

    if ErrorMessage201 = true {
      set gui2:addlabel("<size=15>inclination under 0 degrees, [0, 360]</size>"):style:align to "center".
      gui2:addlabel("<size=15>    </size>").
    }
    if ErrorMessage202 = true {
      set gui2:addlabel("<size=15>inclination above 360 degrees, [0, 360]</size>"):style:align to "center".
      gui2:addlabel("<size=15>    </size>").
    }
    if ErrorMessage203 = true {
      set gui2:addlabel("<size=15>inclination input contains letters, use numbers only</size>"):style:align to "center".
      gui2:addlabel("<size=15>    </size>").
    }
}

//

Function CompleteParameterGUI {
  set RendWindows to false.
  set FinishProcedure to false.

  GUISetup1().
  GUISetup2().

  until FinishProcedure = true {
    wait 1.
  }
  gui:hide().
  gui1:hide().
  gui2:hide().
  // clearguis().
  if RendWindows = false {
    set TargetBody to GUIEmptyBodyList[0].
    set TargetPeriapsis to textbox2:text:tonumber().
    set TargetInclination to textbox3:text:tonumber().
    set ParameterList to list(TargetBody, TargetPeriapsis, TargetInclination).
  } else {
    local TargetVessel is RendText:text.
    set ParameterList to list(TargetVessel).
  }
  return ParameterList.
}

Function StatusCheck {
  local gui is gui(400).
  set gui:y to 30.
  local StatusCheckDone is false.

  if ship:status <> "ORBITING" {
    local label1 is gui:addlabel("<b><size=20>Not in (a stable) orbit!</size></b>").
    set label1:style:align to "center".
    local label2 is gui:addlabel("<b><size=20>Press the button if you're in a stable orbit.</size></b>").
    set label2:style:align to "center".
    gui:addlabel("<size=10> </size>").
    local OrbitButton is gui:addbutton("In a stable orbit").
    gui:show().
    set OrbitButton:onclick to {if ship:status = "ORBITING" {set StatusCheckDone to true.}}.
  } else {
    set StatusCheckDone to true.
  }

  wait until StatusCheckDone = true.
  gui:dispose().
}

Function CircGUI {
  local gui is gui(400).
  local FinalOption is "x".
  local label1 is gui:addlabel("<b><size=15>Circularization needed before continuing, choose where to circularize. If no option is picked within 20 seconds the script will choose where to circularize.</size></b>").
  set label1:style:align to "center".
  local PerButton is gui:addbutton("<size=15>Circularize at the periapsis</size>").
  local ApoButton is gui:addbutton("<size=15>Circularize at the apoapsis</size>").

  set gui:y to 100.
  gui:show().
  set PerButton:onclick to {set FinalOption to "periapsis".}.
  set ApoButton:onclick to {set FinalOption to "apoapsis".}.

  local StartTime is time:seconds + 20.

  until FinalOption <> "x" {
    if time:seconds > StartTime {
      local RandomNumber is random().
      if RandomNumber < 0.5 {
        set FinalOption to "periapsis".
      } else {
        set FinalOption to "apoapsis".
      }
    }
    wait 1.
  }
  gui:dispose().
  return FinalOption.
}

}
print "read lib_gui".
