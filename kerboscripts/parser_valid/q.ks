@LAZYGLOBAL on.
SET CONFIG:STAT TO false.
set terminal:brightness to 1.
//set terminal:charwidth to 12.
//set terminal:charheight to 12.
print "Preparing QUAD script files..".
runoncepath("cpu_light.ks").
setLights(0,0.5,0.5).
wait 0.1.
run compileLog.
list files in fileList.
local didCompile is false.
for f in fileList {
	if f:name = "quad.ks" {
		if f:size <> quad_Size {
			run cq(1).
			set didCompile to true.
		}
	}
	else if f:name = "quad_loop.ks" {
		if f:size <> quad_loop_Size {
			run cq(2).
			set didCompile to true.
		}
	}
	else if f:name = "lib_quad.ks" {
		if f:size <> lib_quad_Size {
			run cq(3).
			set didCompile to true.
		}
	}
	else if f:name = "race.ks" {
		if f:size <> race_Size {
			run cq(4).
			set didCompile to true.
		}
	}
	else if f:name = "lib_json.ks" {
		if f:size <> lib_json_Size {
			run cq(5).
			set didCompile to true.
		}
	}
}

if didCompile { print "Compiling finished..". wait 0.4. }



//now run the damned thing already

clearguis().
runoncepath("cam.ks").
runoncepath("lib_quad.ksm").
runoncepath("lib_json.ksm").
runoncepath("race.ksm").
runoncepath("lib_formation.ks").
runoncepath("quad_loop.ksm").
runoncepath("quad_GUI.ks").
print "Running Quad setup..".
core:doaction("close terminal",true).
runpath("quad.ksm").


reboot.