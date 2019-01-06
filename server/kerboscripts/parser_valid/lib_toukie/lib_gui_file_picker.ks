@lazyglobal off.

{
global T_GUIFilePicker is lexicon(
  "MenuPicker", MenuPicker@
).

clearguis().

local gui1 is gui(300, 500).
set gui1:y to 200.
// gui1 for scripts of current series
local gui2 is gui(300, 500).
set gui2:y to 200.
// gui2 for all scripts
local MainFiles is open("0:/missions_toukie/").
local DoneWaiting is false.
local CopyPaste is "x".
deletepath(missionrunner).

Function SeriesFilesGetter {
  parameter ChosenSeries.

  local FileNumber is 0.
  local label1 is gui1:addlabel("<b> Choose a file to run</b>").
  set label1:style:align to "center".
  local sb is gui1:addscrollbox().

  local FileLex is lexicon().
  local FileLexLoc is lexicon().

  For SomeFile in MainFiles {
    if SomeFile:Name:contains(ChosenSeries) {
      local IndividualFile is sb:addbutton(SomeFile:name).
      set IndividualFile:style:width to 265.
      set IndividualFile:style:align to "center".
      local IndividualFileNum is "File" + FileNumber.
      FileLex:add(IndividualFileNum, IndividualFile).
      FileLexLoc:add(IndividualFileNum, SomeFile:name).
      set FileNumber to FileNumber + 1.
    }
  }

  local LexReadingLength is 0.
  until LexReadingLength = FileLex:length {
    local currLength is LexReadingLength.
    set FileLex["File" + LexReadingLength]:onclick to {
      set CopyPaste to FileLexLoc["File" + CurrLength].
      log "T_Boot[" + char(34) + "CopyAndRunFile" + char(34) + "](" + char(34) + CopyPaste + char(34) + ", " + char(34) + "0:/missions_toukie/" + char(34) + ")." to missionrunner.
      set DoneWaiting to true.
    }.
    set LexReadingLength to LexReadingLength + 1.
  }

  set sb:style:height to 35 * (FileLex:length + 1).
  local BackButton is sb:addbutton("Back").
  set BackButton:style:width to 265.
  set BackButton:style:align to "center".
  set BackButton:onclick to BackButtonOptions@.
  gui1:show().
}

Function BackButtonOptions {
  gui1:hide().
  AllFilesGetter().
}

Function AllFilesGetter {
  local FileNumber is 0.
  local label1 is gui2:addlabel("<b> Choose a file to run</b>").
  set label1:style:align to "center".
  local sb is gui2:addscrollbox().

  local FileLex is lexicon().
  local FileLexLoc is lexicon().

  For SomeFile in MainFiles {
    local IndividualFile is sb:addbutton(SomeFile:name).
    set IndividualFile:style:width to 265.
    set IndividualFile:style:align to "center".
    local IndividualFileNum is "File" + FileNumber.
    FileLex:add(IndividualFileNum, IndividualFile).
    FileLexLoc:add(IndividualFileNum, SomeFile:name).
    set FileNumber to FileNumber + 1.
  }

  local LexReadingLength is 0.
  until LexReadingLength = FileLex:length {
    local currLength is LexReadingLength.
    set FileLex["File" + LexReadingLength]:onclick to {
      set CopyPaste to FileLexLoc["File" + CurrLength].
      log "T_Boot[" + char(34) + "CopyAndRunFile" + char(34) + "](" + char(34) + CopyPaste + char(34) + ", " + char(34) + "0:/missions_toukie/" + char(34) + ")." to missionrunner.
      set DoneWaiting to true.
    }.
    set LexReadingLength to LexReadingLength + 1.
  }

  set sb:style:height to 35 * FileLex:length.
  gui2:show().
}

Function MenuPicker {
  parameter ChosenSeries is "none".

  if ChosenSeries = "none" {
    AllFilesGetter().
  } else {
    SeriesFilesGetter(ChosenSeries).
  }

  wait until DoneWaiting = true.
  clearguis().
  run missionrunner.

}

}
