function wants_three_args {
  parameter p1, p2, p3.

  print "args were: " + p1 + ", " + p2 + ", " + p3.
}

declare a is list(1, 2, 3).
for b in a {
  print "stuff"
}

print "Testing function call with too few args.".
print "You should expect an error when this runs.".
print " ".

wants_three_args("arg1", "arg2"). // missing arg3.