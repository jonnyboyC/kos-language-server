For filename in core:currentvolume:files:keys {
  if filename:startswith("lib_") {
    if filename:endswith(".ks") {
      print "Found file called: " + filename.
      runpath(filename).
    }
  }
}
