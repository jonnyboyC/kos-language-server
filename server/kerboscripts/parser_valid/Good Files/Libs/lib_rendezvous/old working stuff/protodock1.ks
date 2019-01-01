lock steering to -(ship:position - vessel("duck"):position).
set vangdone to false.
until vangdone = true {
  if vang(ship:facing:vector, -(ship:position - vessel("duck"):position)) < 2 {
    wait 5.
    if vang(ship:facing:vector, -(ship:position - vessel("duck"):position)) < 2 {
      set vangdone to true.
    }
  }
}

set vangdone to false.

print "sending...".
set message to "Command 1".
set c to vessel("duck"):connection.
c:sendmessage(message).
print "sent...".
wait until false.
