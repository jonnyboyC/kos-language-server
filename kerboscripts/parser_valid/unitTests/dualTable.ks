
local a is 10.
{
  local lock a to "10".
  local a is 10.
  print(a).
}
print(a).

parameter b is 10.
{
  local function b { return "10". }.
  local b is 10.
  print(b).
}
print(b).