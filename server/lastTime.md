You were in the process of merging the resolver and function resolver together. 
This boiled down to adding a mode to the resolve and run it for only functions first
then running it for both to acheive the same outcome.

Other thoughts. Add an invalid suffix term that is used whenever we get to an incorrect
suffixterm or trailer. This would be used for suffix term completions.