parameter i.

if i = 1 or i = 0 {
	log " " to quad.ksm.
	deletepath("quad.ksm").
	print "compiling quad.ks".
	wait 0.1.
	compile quad.
}
if i = 2 or i = 0 {
	log " " to quad_loop.ksm.
	deletepath("quad_loop.ksm").
	print "compiling quad_loop".
	wait 0.1.
	compile quad_loop.
}
if i = 3 or i = 0 {
	log " " to lib_quad.ksm.
	deletepath("lib_quad.ksm").
	print "compiling lib_quad".
	wait 0.1.
	compile lib_quad.
}
if i = 4 or i = 0 {
	log " " to race.ksm.
	deletepath("race.ksm").
	print "compiling race".
	wait 0.1.
	compile race.
}
if i = 5 or i = 0 {
	log " " to lib_json.ksm.
	deletepath("lib_json.ksm").
	print "compiling lib_json".
	wait 0.1.
	compile lib_json.
}


//store filesizes to compileLog.ks
log " " to compileLog.ks.
deletepath("compileLog.ks").
list files in fileList.
for f in fileList {
	if f:name = "quad.ks" {
		log "set quad_Size to " + f:size + "." to compileLog.ks.
	}
	else if f:name = "quad_loop.ks" {
		log "set quad_loop_Size to " + f:size + "." to compileLog.ks.
	}
	else if f:name = "lib_quad.ks" {
		log "set lib_quad_Size to " + f:size + "." to compileLog.ks.
	}
	else if f:name = "race.ks" {
		log "set race_Size to " + f:size + "." to compileLog.ks.
	}
	else if f:name = "lib_json.ks" {
		log "set lib_json_Size to " + f:size + "." to compileLog.ks.
	}
	
}
