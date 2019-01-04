// local function test1 {
//   parameter a is 0.
//   print a.
// }

// local function test2 {
//   parameter a is 0.
//   print a.
// }

// local b is { parameter b is 0. print b. }.
// local c is { parameter b is 0. print b. }.

// function createTerrainVecdraws {
//   showTerrainVecdraws(false).
//   set vd_terrainlist to list().
//   local steps is 0.
//   for i in range(steps) {
//     vd_terrainlist:add(vecdraw(v(0,0,0),v(0,0,0),rgba(1,i/steps,0,0.5),"",1,terrainVecs,2)).
//   }
// }
// function showTerrainVecdraws {
//   parameter p.
//   for i in range(vd_terrainlist:length) { set vd_terrainlist[i]:show to p. } //color to rgba(1,i/steps,0,0.5). }
// }

function adjust {
	parameter sign.
	local func is { print "hi". }.
  func(func()).
}