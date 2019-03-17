@lazyglobal off.
{

clearscreen.
set kuniverse:timewarp:warp to 0.
clearvecdraws().
clearguis().
set config:ipu to 200.
//core:doaction("Close Terminal", true).

local LibVersion is "1.4.3".
local ContinueStart is true.

if defined BootVersion = false {
  set ContinueStart to false.
  if exists("1:/boot_updater") and exists("BootCheck") = false {
    run boot_updater.
  } else {
    HUDtext("WARNING: BOOT VERSION OR MAIN SCRIPT OUT OF DATE, CHECK THE README.txt FILE", 15, 2, 30, red, true).
  }
} else if BootVersion <> LibVersion {
  set ContinueStart to false.
  if exists("1:/boot_updater") and exists("BootCheck") = false {
    run boot_updater.
  } else {
    HUDtext("WARNING: BOOT VERSION OR MAIN SCRIPT OUT OF DATE, CHECK THE README.txt FILE", 15, 2, 30, red, true).
  }
}

deletepath(BootCheck).

// checks if booter is up to date

lock throttle to 0.
unlock throttle.

local EngList is list().
list Engines in EngList.
for Eng in EngList {
  set Eng:thrustlimit to 100.
}

// default throttle settings

local ShipName is ship:name.
local ShipSeries is Shipname:substring(0, ShipName:length - 3).
// Apollo 11 becomes Apollo
local FileList is open("0:/missions_toukie/").

local FoundSeries is false.
local SeriesList is list().

For ScriptFile in FileList {
  if ScriptFile:name:contains(ShipSeries) {
    SeriesList:add(ScriptFile).
    set FoundSeries to true.
  }
}

// checks if naming series is present in mission script folder

local FoundCurrentMission is false.

For PotentialFile in SeriesList {
  local ShipNamePlus is Ship:Name + ".ks".
  if PotentialFile:name = ShipNamePlus {
    set FoundCurrentMission to true.
  }
}

// checks if name of vessel is a mission script

if FoundCurrentMission = true {
  HUDtext("Running " + ShipName + ".ks", 15, 2, 30, green, true).
  T_Boot["CopyAndRunFile"](ShipName, "0:/missions_toukie/").
} else if FoundSeries = true {
  HUDtext("Specific mission script not found, choose different script", 15, 2, 30, yellow, true).
  T_Boot["CopyAndRunFile"]("lib_gui_file_picker", "0:/lib_toukie/").
  T_GUIFilePicker["MenuPicker"](ShipSeries).
} else {
  HUDtext("no suitable script found, choose different script", 15, 2, 30, red, true).
  T_Boot["CopyAndRunFile"]("lib_gui_file_picker", "0:/lib_toukie/").
  T_GUIFilePicker["MenuPicker"]().
}

}
