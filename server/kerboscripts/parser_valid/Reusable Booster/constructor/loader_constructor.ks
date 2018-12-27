@LAZYGLOBAL on.
SET CONFIG:STAT TO false.
set terminal:brightness to 1.
//set terminal:charwidth to 12.
//set terminal:charheight to 12.
print "Preparing Constructor QUAD script files..".
runoncepath("cpu_light.ksm").
setLights(0,0.5,0.5).
wait 0.1.


clearguis().
//runoncepath("cam.ks").
runoncepath("constructor/lib_constructor.ks").
//runoncepath("lib_json.ks").
//runoncepath("race.ks").
runoncepath("constructor/loop_constructor.ks").
//runoncepath("constructor/GUI_constructor.ks").
print "Running Quad setup..".
//core:doaction("close terminal",true).
runpath("constructor/main_constructor.ks").

//LOG PROFILERESULT() TO qprof.csv.