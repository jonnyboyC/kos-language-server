wait 1.
T_Stage["LaunchStage"]().
T_Stage["StageCheck"]().

T_GUI["StatusCheck"]().
local GivenParameterList is T_GUI["CompleteParameterGUI"]().
T_ReadOut["InitialReadOut"](10).

T_GAPAPOV["GAPAPOV"](GivenParameterList).
clearguis().

wait 5.
HUDtext("Script complete", 5, 2, 30, red, true).
wait 0.5.
HUDtext("Script complete", 5, 2, 30, rgb(1, 0.647, 0), true).
wait 0.5.
HUDtext("Script complete", 5, 2, 30, yellow, true).
wait 0.5.
HUDtext("Script complete", 5, 2, 30, green, true).
wait 0.5.
HUDtext("Script complete", 5, 2, 30, blue, true).
wait 0.5.
HUDtext("Script complete", 5, 2, 30, purple, true).
