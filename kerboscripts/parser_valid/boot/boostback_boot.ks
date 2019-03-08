// boostback_boot.ks
clearscreen.
wait 1.
print "boostback boot program running, waiting for message to start.".
local done is false.

if altitude > 40000 and ship:messages:empty runpath("0:/boostback.ks", 0).

until done {
	if not ship:messages:empty {
		local msg is ship:messages:pop.
		if msg:content = "boostback" {
			switch to 0.
			runpath("0:/boostback.ks", 0, msg:sender).
			set done to true.
		}
		else if msg:content = "good luck" {
			switch to 0.
			runpath("0:/boostback.ks", 1, msg:sender).
			set done to true.
		}
	}
	wait 0.
}