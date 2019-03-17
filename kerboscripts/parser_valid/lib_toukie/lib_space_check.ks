@lazyglobal off.

{

global T_SpaceCheck is lexicon(
  "FileSize", FileSize@,
  "DeleteOldLib", DeleteOldLib@,
  "AvailableSpaceCheck", AvailableSpaceCheck@,
  "CopyAndRunLib", CopyAndRunLib@
).

local Continue is false.
local FinalStr is list().

Function FileSize {
 parameter TargetFile.
 if exists(TargetFile) {
 return open(TargetFile):size.
 }
}

Function DeleteOldLib {
  local FileList is list().
  list Files in FileList.
  for SomeFile in FileList {
    if SomeFile:name:contains("lib") {
      deletepath(SomeFile).
  	 }
    }
}

Function AvailableSpaceCheck {
  parameter Dependencies. // list of required files

  DeleteOldLib().
  local AvailSpace is core:volume:freespace.
  For SomeFile in Dependencies {
    local LocalFileSize is FileSize(SomeFile).
    set AvailSpace to AvailSpace - LocalFileSize.
    }
  print AvailSpace.
  if AvailSpace < 0 {
  HUDtext( "Not enough storage! Need " + abs(AvailSpace) + " more storage", 15, 2, 45, red, true).
} else {
  set Continue to true.
}
}

Function FileConvertion {
  parameter StartStr.

  local splitIndex is StartStr:findlast("/").
  local fileName is StartStr:substring(splitIndex + 1 ,  StartStr:length - splitIndex - 1).
  local Path is StartStr:substring(0 ,  StartStr:length - filename:length).

  FinalStr:add(FileName).
  FinalStr:add(Path).
  return FinalStr.
}

Function CopyAndRunLib {
  Parameter Dependencies. //list of items

  AvailableSpaceCheck(Dependencies).
  if Continue = true {
    For SomeFile in Dependencies {
      local CARFile is FileConvertion(SomeFile).
      print CARFile.
      T_Boot["CopyAndRunFile"](CARFile[0], CARFile[1]).
      FinalStr:clear().

    }
  }
}

}
