global T_ReadOut is lexicon(
  "InitialReadOut", InitialReadOut@,
  "PhaseAngleGUI", PhaseAngleGUI@,
  "EjectionAngleGUI", EjectionAngleGUI@,
  "ClosestApproachGUI", ClosestApproachGUI@,
  "CandidateScoreGUI", CandidateScoreGUI@,
  "AdvScoreReadOutGUI", AdvScoreReadOutGUI@,
  "RetrogradeAngleGUI", RetrogradeAngleGUI@,
  "QuitAllGUI", QuitAllGUI@
  ).

global ReadOutGUI  is gui(300).
local IntroductionGUI is ReadOutGUI:addlabel("<size=20>Readouts:</size>").
set IntroductionGUI:style:align to "center".
ReadOutGUI:addlabel("<size=20>__________________________</size>").

local Ph1 is ReadOutGUI:addlabel("<size=15>Current phase angle: </size>").
local Ph2 is ReadOutGUI:addtextfield("Loading...").
set Ph2:enabled to false.
local Ph3 is ReadOutGUI:addlabel("<size=15>Target phase angle:  </size>").
local Ph4 is ReadOutGUI:addtextfield("Loading...").
set Ph4:enabled to false.
local PhBreaker is ReadOutGUI:addlabel("<size=20>__________________________</size>").

local Ej1 is ReadOutGUI:addlabel("<size=15>Current angle: </size>").
local Ej2 is ReadOutGUI:addtextfield("Loading...").
set Ej2:enabled to false.
local Ej3 is ReadOutGUI:addlabel("<size=15>Target ejection angle:  </size>").
local Ej4 is ReadOutGUI:addtextfield("Loading...").
set Ej4:enabled to false.
local EjBreaker is ReadOutGUI:addlabel("<size=20>__________________________</size>").

local Cl1 is ReadOutGUI:addlabel("<size=15>Closest approach:  </size>").
local Cl2 is ReadOutGUI:addtextfield("Loading...").
set Cl2:enabled to false.
local Cl3 is ReadOutGUI:addtextfield("Loading...").
set Cl3:enabled to false.
local Cl4 is ReadOutGUI:addtextfield("Loading...").
set Cl4:enabled to false.
local Cl5 is ReadOutGUI:addtextfield("Loading...").
set Cl5:enabled to false.
local ClBreaker is ReadOutGUI:addlabel("<size=20>__________________________</size>").

local Ca1 is ReadOutGUI:addlabel("<size=15>Candidate score: </size>").
local Ca2 is ReadOutGUI:addtextfield("Loading...").
set Ca2:enabled to false.
local Ca3 is ReadOutGUI:addlabel("<size=15>Score to beat: </size>").
local Ca4 is ReadOutGUI:addtextfield("Loading...").
set Ca4:enabled to false.
local CaBreaker is ReadOutGUI:addlabel("<size=20>__________________________</size>").

local Pe1 is ReadOutGUI:addlabel("<size=15>Current angle from planet's retrograde: </size>").
local Pe2 is ReadOutGUI:addtextfield("Loading...").
set Pe2:enabled to false.
local Pe3 is ReadOutGUI:addlabel("<size=15>Target angle from planet's retrograde:  </size>").
local Pe4 is ReadOutGUI:addtextfield("Loading...").
set Pe4:enabled to false.
local PeBreaker is ReadOutGUI:addlabel("<size=20>__________________________</size>").

local Ad1 is ReadOutGUI:addlabel("<size=15></size>").
local Ad2 is ReadOutGUI:addtextfield("Loading...").
set Ad2:enabled to false.
local Ad3 is ReadOutGUI:addlabel("<size=15></size>").
local Ad4 is ReadOutGUI:addtextfield("Loading...").
set Ad4:enabled to false.
local Ad5 is ReadOutGUI:addlabel("<size=15></size>").
local Ad6 is ReadOutGUI:addtextfield("Loading...").
set Ad6:enabled to false.
local Ad7 is ReadOutGUI:addlabel("<size=15></size>").
local Ad8 is ReadOutGUI:addtextfield("Loading...").
set Ad8:enabled to false.
local AdBreaker is ReadOutGUI:addlabel("<size=20>__________________________</size>").

local PhaseAngleReadOut is false.
local EjectAngleReadOut is false.
local ClosestAppReadout is false.
local CandScoreReadout  is false.
local AdvScoreReadOut   is false.
local PeriAngleReadout  is false.

local ResetTimer is 0.

Function InitialReadOut {
  Parameter RefreshRate. // RefreshRate of 10 is fine
  QuitAllGUI().
  set ReadOutGUI:x to 0.
  set ReadOutGUI:y to 150.
  ReadOutGUI:show().

  on floor(time:seconds * RefreshRate) {

    if PhaseAngleReadOut = true {
      Ph1:show().
      Ph2:show().
      Ph3:show().
      Ph4:show().
      PhBreaker:show().
    }

    if EjectAngleReadOut = true {
      Ej1:show().
      Ej2:show().
      Ej3:show().
      Ej4:show().
      EjBreaker:show().
    }

    if ClosestAppReadout = true {
      Cl1:show().
      Cl2:show().
      Cl3:show().
      Cl4:show().
      Cl5:show().
      ClBreaker:show().
    }

    if CandScoreReadout = true {
      Ca1:show().
      Ca2:show().
      Ca3:show().
      Ca4:show().
      CaBreaker:show().
    }

    if AdvScoreReadOut = true {
      Ad1:show().
      Ad2:show().
      Ad3:show().
      Ad4:show().
      Ad5:show().
      Ad6:show().
      Ad7:show().
      Ad8:show().
      AdBreaker:show().
    }

    if PeriAngleReadout = true {
      Pe1:show().
      Pe2:show().
      Pe3:show().
      Pe4:show().
      PeBreaker:show().
    }


    if ResetTimer < (15 * RefreshRate * kuniverse:timewarp:rate) {
      set ResetTimer to ResetTimer + 1.
    } else {
      set ResetTimer to 0.
      QuitAllGUI().
    }
    preserve.
  }
}

Function PhaseAngleGUI {
  Parameter CurrentPhaseAngle.
  Parameter TargetPhaseAngle.

  set Ph2:text to (round(CurrentPhaseAngle,2)):tostring.
  set Ph4:text to (round(TargetPhaseAngle, 2)):tostring.
  set PhaseAngleReadOut to true.
}

Function QuitPhaseAngleGUI {
  Ph1:hide().
  Ph2:hide().
  Ph3:hide().
  Ph4:hide().
  PhBreaker:hide().
  set PhaseAngleReadOut to false.
}

Function EjectionAngleGUI {
  Parameter CurrentEjectionAngle.
  Parameter TargetEjectionAngle.
  Parameter ProOrRetro.

  if ProOrRetro = "pro" {
    set Ej1:text to "Current angle from prograde: ".
  } else if ProOrRetro = "retro" {
    set Ej1:text to "Current angle from retrograde: ".
  }

  set Ej2:text to (round(CurrentEjectionAngle,2)):tostring.
  set Ej4:text to (round(TargetEjectionAngle, 2)):tostring.
  set EjectAngleReadOut to true.
}

Function QuitEjectionAngleGUI {
  Ej1:hide().
  Ej2:hide().
  Ej3:hide().
  Ej4:hide().
  EjBreaker:hide().
  set EjectAngleReadOut to false.
}

Function ClosestApproachGUI {
  Parameter ClosestApproach.

  set Cl2:text to "m  " + (round(ClosestApproach)):tostring.
  set Cl3:text to "km " + (round(ClosestApproach/1000)):tostring.
  set Cl4:text to "Mm " + (round(ClosestApproach/1000000)):tostring.
  set Cl5:text to "Gm " + (round(ClosestApproach/1000000000)):tostring.
  set ClosestAppReadout to true.
}

Function QuitClosestApproachGUI {
  Cl1:hide().
  Cl2:hide().
  Cl3:hide().
  Cl4:hide().
  Cl5:hide().
  ClBreaker:hide().
  set ClosestAppReadout to false.
}

Function CandidateScoreGUI {
  Parameter CandidateScore.
  Parameter ScoreToBeat.

  set Ca2:text to CandidateScore:tostring.
  set Ca4:text to ScoreToBeat:tostring.
  set CandScoreReadout to true.
}

Function QuitCandidateScoreGUI {
  Ca1:hide().
  Ca2:hide().
  Ca3:hide().
  Ca4:hide().
  CaBreaker:hide().
  set CandScoreReadout to false.
}

Function AdvScoreReadOutGUI {
  Parameter ProfileName.
  Parameter ScoreInputList.

  local MoonProfile is list("Transfer penalty:", "Periapsis penalty:", "Inclination penalty:", "Total penalty:").
  local PlanProfile is list("Transfer penalty:", "SOIexit penalty:", "Periapsis penalty:", "Total penalty:").
  local ImprProfile is list("Inclination penalty:" ,"Periapsis penalty:", "Total penalty:").

  local Profile is list().

  if ProfileName = "Moon" {
    set Profile to MoonProfile:copy.
  } else if ProfileName = "Interplanetary" {
    set Profile to PlanProfile:copy.
  } else if ProfileName = "Improve" {
    set Profile to ImprProfile:copy.
  }

  set Ad1:text to Profile[0].
  set Ad2:text to ScoreInputList[0]:tostring.
  set Ad3:text to Profile[1].
  set Ad4:text to ScoreInputList[1]:tostring.
  set Ad5:text to Profile[2].
  set Ad6:text to ScoreInputList[2]:tostring.
  if Profile:length = 4 {
    set Ad7:text to Profile[3].
    set Ad8:text to ScoreInputList[3]:tostring.
  }
  set AdvScoreReadOut to true.
}

Function QuitAdvScoreReadOutGUI {
  Ad1:hide().
  Ad2:hide().
  Ad3:hide().
  Ad4:hide().
  Ad5:hide().
  Ad6:hide().
  Ad7:hide().
  Ad8:hide().
  AdBreaker:hide().
  set AdvScoreReadOut to false.
}

Function RetrogradeAngleGUI {
  Parameter CurrentRetrogradeAngle.
  Parameter TargetRetrogradeAngle.

  set Pe2:text to (round(CurrentRetrogradeAngle,2)):tostring.
  set Pe4:text to (round(TargetRetrogradeAngle, 2)):tostring.
  set PeriAngleReadout to true.
}

Function QuitRetrogradeAngleGUI {
  Pe1:hide().
  Pe2:hide().
  Pe3:hide().
  Pe4:hide().
  PeBreaker:hide().
  set PeriAngleReadout to false.
}

Function QuitAllGUI {
  QuitPhaseAngleGUI().
  QuitEjectionAngleGUI().
  QuitClosestApproachGUI().
  QuitCandidateScoreGUI().
  QuitAdvScoreReadOutGUI().
  QuitRetrogradeAngleGUI().
}
