runOncePath("shadowLib.ks").

local function func {
  parameter param.
  print(param).
}
local lock lock to 10.
local var is "example". 

print(lock).
print(var).
print(func(10)).