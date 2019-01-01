Function GAPAPOV {
  Parameter GivenParameterList.

  local CurBodyIsPlanet   is "?".
  local TarBodyIsPlanet   is "?".
  local RendezvousNeeded  is "?".
  local TargetVessel      is "?".
  local TargetBody        is "?".
  local TargetPeriapsis   is "?".
  local TargetInclination is "?".
  local FinishProcedure   is false.

  if GivenParameterList:length = 1 {
    // we have a rendezvous
    set RendezvousNeeded  to true.
    set TargetVessel      to vessel(GivenParameterList[0]).
    set TargetBody        to TargetVessel:body.
    set TargetPeriapsis   to TargetVessel:orbit:periapsis.
    set TargetInclination to TargetVessel:orbit:inclination.
  } else if GivenParameterList:length = 3 {
    // we have a transfer
    set RendezvousNeeded  to false.
    set TargetBody        to GivenParameterList[0].
    set TargetPeriapsis   to GivenParameterList[1].
    set TargetInclination to GivenParameterList[2].
  }

  if TargetInclination = 0 {
    // preventing divide by 0 error
    set TargetInclination to 0.001.
  }

  if ship:body = TargetBody and RendezvousNeeded = false {
    // we only have to change periapsis / Inclination
    T_Transfer["ChangeOrbit"](TargetPeriapsis, TargetInclination).
    set FinishProcedure to true.
  }

  if ship:body:body <> "Sun" {
    // we are in orbit around a moon
    set CurBodyIsPlanet to false.
  } else {
    // we are in orbit around a planet
    set CurBodyIsPlanet to true.
  }

  if TargetBody:body <> "Sun" {
    set TarIsPlanet to false.
  } else {
    set TarIsPlanet to true.
  }

  if FinishProcedure = false {
    if CurBodyIsPlanet  = false {
      if ship:body:body = TargetBody:body {
        // Mun -> Minmus situation
        T_Transfer["MoonToMoon"](TargetBody, TargetPeriapsis, TargetInclination).
        set FinishProcedure to true.
      } else {
        // return to parent body (i.e. Mun -> kerbin) and all other burns
        T_Transfer["MoonToReferencePlanet"](ship:body, ship:body:body, TargetPeriapsis, TargetInclination).
        if ship:body = TargetBody {
          set FinishProcedure to true.
        }
      }
    }
  }

  // theres no way we're still orbiting a moon and need to go somewhere else
  // new if loop because we might have arrived at the target in the last loop
  if FinishProcedure = false {
    local TemporaryDestination is TargetBody.
    if TarIsPlanet = false {
      // if target is a moon go to its parent first
      set TemporaryDestination to TargetBody:body.
    }
    if TemporaryDestination <> ship:body {
      // i.e. Kerbin -> Mun would go to kerbin (again) if there was no check
      T_Transfer["InterplanetaryTransfer"](TemporaryDestination, TargetPeriapsis, TargetInclination).
    }

    if TarIsPlanet = false {
      // go to moon! i.e. Kerbin -> Mun or Duna -> Ike
      T_Transfer["MoonTransfer"](TargetBody, TargetPeriapsis, TargetInclination).
    }
    set FinishProcedure to true // for formality (we wont be using this var anymore)
  }

  if RendezvousNeeded = true {
    // do rendezvous (we've just gotten ourselfs in the right orbit)
    HUDtext("Rendezvous is go", 5, 2, 30, red, true).
    T_Rendezvous["CompleteRendezvous"](TargetVessel).
    HUDtext("Rendezvous cleared, docking...", 5, 2, 30, red, true).
    T_Docking["Dock"](TargetVessel).
  }
}
