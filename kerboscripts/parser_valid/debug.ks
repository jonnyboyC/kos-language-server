set foreVec to vecdraw(v(0,0,0),v(0,0,0),cyan,"fore",1,true,0.2).
set topVec to vecdraw(v(0,0,0),v(0,0,0),magenta,"top",1,true,0.2).
set starVec to vecdraw(v(0,0,0),v(0,0,0),green,"star",1,true,0.2).

local partList is list().
set partList to ship:partstagged("debug").
if partList:length = 0 set partList to ship:parts.

for cur_part in partList {
	
	local foo is highlight(cur_part,RGB(0,1,1)).
	brakes off.
	until brakes {
		clearscreen.
		print cur_part:name.
		print "---------------------------".
		for cur_module_str in cur_part:modules {
			set cur_module to cur_part:GETMODULE(cur_module_str).
			print cur_module:name.
			if cur_module:allfields:length > 0 { for i in cur_module:allfields { print "...Field: " + i. } }
			if cur_module:allevents:length > 0 { for i in cur_module:allevents { print "...Event: " + i. } }
			if cur_module:allactions:length > 0 { for i in cur_module:allactions { print "...Action: " + i. } }
		}
		print "stage: " + cur_part:stage.
		print "------------------------------------".
	
	
		set foreVec:start to cur_part:position.
		set topVec:start to cur_part:position.
		set starVec:start to cur_part:position.
		
		set foreVec:vec to cur_part:facing:vector.
		set topVec:vec to cur_part:facing:topvector.
		set starVec:vec to cur_part:facing:starvector.
		
		wait 0.
	}
	set foo:ENABLED to false.
}
