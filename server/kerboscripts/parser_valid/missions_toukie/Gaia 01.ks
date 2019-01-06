local DependenciesList is List(
  ("0:/lib_toukie/lib_stage"),
  ("0:/lib_toukie/lib_atmos_launch")
).

T_Boot["CopyAndRunFile"]("lib_space_check", "0:/lib_toukie/").
T_SpaceCheck["CopyAndRunLib"](DependenciesList).

// REAL MISSION

T_AtmosLaunch["MainLaunch"]().

// REAL MISSION
